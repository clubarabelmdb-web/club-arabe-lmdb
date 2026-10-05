import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabaseAdmin";
import {
  AssistantMessage,
  GeminiAssistantError,
  genererReponseGemini,
} from "@/lib/geminiAssistant";

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

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    return NextResponse.json({ error: "Connecte-toi avec un compte administrateur." }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return NextResponse.json({ error: "La configuration serveur est incomplète." }, { status: 500 });
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

  try {
    const answer = await genererReponseGemini(
      instructionSysteme,
      messagesValue as AssistantMessage[]
    );
    return NextResponse.json({ answer });
  } catch (error) {
    if (error instanceof GeminiAssistantError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Erreur inattendue de l'assistant administrateur :", error);
    return NextResponse.json(
      { error: "Une erreur inattendue est survenue. Réessaie plus tard." },
      { status: 500 }
    );
  }
}
