import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabaseAdmin";

const instructionSysteme = `Tu es l'assistant du tableau de bord du Club Arabe du Lycée Maba Diakhou Ba.
Réponds en français, clairement et brièvement. Tu aides les administrateurs à comprendre les fonctions du site et à savoir où effectuer une tâche.
Le tableau de bord permet notamment de gérer les demandes d'inscription et les membres, de vérifier une carte, gérer la galerie, les paiements, les informations Wave/Orange Money, les notifications, les actualités, les activités, le bureau et les administrateurs.
Tu es en lecture seule : tu ne peux ni consulter les données des membres, ni valider ou supprimer des inscriptions, ni créer ou retirer des comptes. Ne prétends jamais avoir effectué une action.
Ne demande pas et ne répète pas de mot de passe, de clé secrète, ni de donnée personnelle. Si une question demande une action réelle ou des données que tu ne peux pas consulter, explique-le et indique la page du tableau de bord à utiliser. Si tu n'es pas sûr, dis-le sans inventer.`;

type Message = {
  role: "user" | "assistant";
  content: string;
};

function estMessage(value: unknown): value is Message {
  if (!value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content.trim().length > 0 &&
    message.content.length <= 1500
  );
}

function extraireTexteGemini(payload: unknown): string | null {
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

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    return NextResponse.json({ error: "Connecte-toi avec un compte administrateur." }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return NextResponse.json({ error: "La configuration serveur est incomplète." }, { status: 500 });
  }
  if (!geminiApiKey) {
    return NextResponse.json(
      { error: "L’assistant IA n’est pas encore configuré. Ajoute GEMINI_API_KEY dans Vercel." },
      { status: 503 }
    );
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Ta session a expiré. Reconnecte-toi." }, { status: 401 });
  }

  const supabaseAdmin = createAdminClient();
  const { data: admins, error: adminError } = await supabaseAdmin
    .from("administrateurs")
    .select("id")
    .eq("user_id", userData.user.id)
    .limit(1);
  if (adminError) {
    console.error("Impossible de vérifier les droits d'accès à l'assistant IA :", adminError);
    return NextResponse.json({ error: "Impossible de vérifier tes droits administrateur." }, { status: 500 });
  }
  if (!admins?.length) {
    return NextResponse.json({ error: "Cette fonction est réservée aux administrateurs." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "La requête est invalide." }, { status: 400 });
  }

  const messagesValue =
    body && typeof body === "object" ? (body as Record<string, unknown>).messages : null;
  if (
    !Array.isArray(messagesValue) ||
    messagesValue.length === 0 ||
    messagesValue.length > 10 ||
    !messagesValue.every(estMessage) ||
    (messagesValue[messagesValue.length - 1] as Message).role !== "user" ||
    messagesValue.reduce(
      (total, message) => total + (estMessage(message) ? message.content.length : 0),
      0
    ) > 6000
  ) {
    return NextResponse.json({ error: "Le message est invalide ou trop long." }, { status: 400 });
  }

  let geminiResponse: Response;
  try {
    geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey,
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: instructionSysteme }] },
          contents: messagesValue.map((message) => ({
            role: (message as Message).role === "assistant" ? "model" : "user",
            parts: [{ text: (message as Message).content.trim() }],
          })),
          generationConfig: { temperature: 0.4, maxOutputTokens: 600 },
        }),
        signal: AbortSignal.timeout(25_000),
      }
    );
  } catch (error) {
    console.error("La requête à l'assistant IA a échoué :", error);
    return NextResponse.json(
      { error: "L’assistant IA ne répond pas pour le moment. Réessaie dans quelques instants." },
      { status: 502 }
    );
  }

  if (!geminiResponse.ok) {
    console.error("Le fournisseur IA a renvoyé une erreur :", geminiResponse.status);
    if (geminiResponse.status === 429) {
      return NextResponse.json(
        { error: "Le quota de l’assistant IA est momentanément atteint. Réessaie plus tard." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "L’assistant IA est momentanément indisponible. Réessaie plus tard." },
      { status: 502 }
    );
  }

  let payload: unknown;
  try {
    payload = await geminiResponse.json();
  } catch {
    return NextResponse.json({ error: "La réponse de l’assistant IA est invalide." }, { status: 502 });
  }

  const answer = extraireTexteGemini(payload);
  if (!answer) {
    return NextResponse.json(
      { error: "L’assistant IA n’a pas pu préparer de réponse. Reformule ta question." },
      { status: 502 }
    );
  }
  return NextResponse.json({ answer });
}
