export type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

export class GeminiAssistantError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "GeminiAssistantError";
  }
}

function extraireTexte(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const candidates = (payload as Record<string, unknown>).candidates;
  if (!Array.isArray(candidates) || !candidates[0] || typeof candidates[0] !== "object") {
    return null;
  }
  const content = (candidates[0] as Record<string, unknown>).content;
  if (!content || typeof content !== "object") return null;
  const parts = (content as Record<string, unknown>).parts;
  if (!Array.isArray(parts)) return null;

  const texte = parts
    .filter((part): part is { text: string } =>
      Boolean(part && typeof part === "object" && typeof (part as Record<string, unknown>).text === "string")
    )
    .map((part) => part.text)
    .join("")
    .trim();
  return texte || null;
}

async function extraireErreur(response: Response): Promise<string | undefined> {
  try {
    const payload: unknown = await response.clone().json();
    if (!payload || typeof payload !== "object") return undefined;
    const error = (payload as Record<string, unknown>).error;
    if (!error || typeof error !== "object") return undefined;
    const message = (error as Record<string, unknown>).message;
    return typeof message === "string" ? message : undefined;
  } catch {
    return undefined;
  }
}

export async function genererReponseGemini(
  instructionSysteme: string,
  messages: AssistantMessage[]
): Promise<string> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new GeminiAssistantError("L’assistant IA n’est pas encore configuré.", 503);
  }

  let listeModelesResponse: Response;
  try {
    listeModelesResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
      headers: { "x-goog-api-key": geminiApiKey },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    console.error("Impossible de joindre l'API Gemini :", error);
    throw new GeminiAssistantError("Impossible de joindre Google Gemini. Réessaie dans quelques instants.", 502);
  }

  if (!listeModelesResponse.ok) {
    const details = await extraireErreur(listeModelesResponse);
    console.error("Impossible de lister les modèles Gemini :", {
      status: listeModelesResponse.status,
      details,
    });
    throw new GeminiAssistantError(
      listeModelesResponse.status === 401 || listeModelesResponse.status === 403
        ? "Google refuse la clé GEMINI_API_KEY. Vérifie la clé et ses restrictions dans Google AI Studio."
        : "Google Gemini ne permet pas de lister les modèles pour cette clé. Vérifie que la Gemini API est activée pour le projet associé.",
      502
    );
  }

  let modelesDisponibles: string[];
  try {
    const listePayload: unknown = await listeModelesResponse.json();
    const models =
      listePayload && typeof listePayload === "object"
        ? (listePayload as Record<string, unknown>).models
        : null;
    if (!Array.isArray(models)) throw new Error("La liste des modèles Gemini est invalide.");
    const modelesAvecGeneration = models
      .filter((model): model is Record<string, unknown> => Boolean(model && typeof model === "object"))
      .filter((model) => {
        const methods = model.supportedGenerationMethods;
        return Array.isArray(methods) && methods.includes("generateContent");
      })
      .map((model) => model.name)
      .filter(
        (name): name is string =>
          typeof name === "string" &&
          name.startsWith("models/") &&
          !/image|audio|embedding/i.test(name)
      );
    const modelesPrisEnCharge = [
      "models/gemini-3-flash-preview",
      "models/gemini-3.1-pro-preview",
    ];
    modelesDisponibles = modelesPrisEnCharge.filter((name) =>
      modelesAvecGeneration.includes(name)
    );
  } catch (error) {
    console.error("Impossible de lire la liste des modèles Gemini :", error);
    throw new GeminiAssistantError("Google Gemini a renvoyé une liste de modèles invalide.", 502);
  }

  if (modelesDisponibles.length === 0) {
    console.error("Aucun modèle Gemini compatible n'est disponible pour cette clé.");
    throw new GeminiAssistantError(
      "Aucun modèle de génération de texte Gemini actuel n’est disponible pour cette clé.",
      502
    );
  }

  let geminiResponse: Response | null = null;
  let dernierErreur: unknown = null;

  for (const modele of modelesDisponibles) {
    try {
      geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${modele}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": geminiApiKey,
          },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: instructionSysteme }] },
            contents: messages.map((message) => ({
              role: message.role === "assistant" ? "model" : "user",
              parts: [{ text: message.content.trim() }],
            })),
            generationConfig: { maxOutputTokens: 600 },
          }),
          signal: AbortSignal.timeout(25_000),
        }
      );
      if (geminiResponse.ok) break;
      const details = await extraireErreur(geminiResponse);
      dernierErreur = {
        modele,
        status: geminiResponse.status,
        statusText: geminiResponse.statusText,
        ...(details ? { details } : {}),
      };
      if (geminiResponse.status === 429) break;
      if (geminiResponse.status === 400 || geminiResponse.status === 404) continue;
      break;
    } catch (error) {
      dernierErreur = error;
      break;
    }
  }

  if (!geminiResponse || !geminiResponse.ok) {
    console.error("Le fournisseur IA a renvoyé une erreur :", dernierErreur);
    throw new GeminiAssistantError(
      geminiResponse?.status === 429
        ? "Le quota de l’assistant IA est momentanément atteint. Réessaie plus tard."
        : "L’assistant IA est momentanément indisponible. Vérifie la clé GEMINI_API_KEY et l’API Gemini.",
      geminiResponse?.status === 429 ? 429 : 502
    );
  }

  let payload: unknown;
  try {
    payload = await geminiResponse.json();
  } catch {
    throw new GeminiAssistantError("La réponse de l’assistant IA est invalide.", 502);
  }

  const answer = extraireTexte(payload);
  if (!answer) {
    throw new GeminiAssistantError(
      "L’assistant IA n’a pas pu préparer de réponse. Reformule ta question.",
      502
    );
  }
  return answer;
}
