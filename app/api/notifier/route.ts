import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminMessaging } from "@/lib/firebaseAdmin";
import { createAdminClient } from "@/lib/supabaseAdmin";

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
    console.error("Impossible de vérifier les droits d'accès aux notifications :", adminError);
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

  const donnees = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const titre = typeof donnees.titre === "string" ? donnees.titre.trim() : "";
  const message = typeof donnees.message === "string" ? donnees.message.trim() : "";
  const typeCible = donnees.typeCible;
  const classe = donnees.classe;
  const classeDestinataire = typeof classe === "string" ? classe.trim() : "";
  if (!titre || titre.length > 120 || !message || message.length > 2000) {
    return NextResponse.json(
      { error: "Le titre (1 à 120 caractères) et le message (1 à 2 000 caractères) sont requis." },
      { status: 400 }
    );
  }
  if (
    (typeCible !== "tous" && typeCible !== "classe") ||
    (typeCible === "classe" && !classeDestinataire) ||
    (typeCible === "tous" && classe !== null)
  ) {
    return NextResponse.json({ error: "Le destinataire choisi est invalide." }, { status: 400 });
  }

  let membresQuery = supabaseAdmin.from("membres").select("id");
  if (typeCible === "classe") {
    membresQuery = membresQuery.eq("classe", classeDestinataire);
  }
  const { data: membres, error: membresError } = await membresQuery;
  if (membresError) {
    console.error("Impossible de charger les destinataires des notifications :", membresError);
    return NextResponse.json({ error: "Impossible de charger les membres destinataires." }, { status: 500 });
  }
  const membreIds = (membres ?? []).map((membre) => membre.id);
  if (membreIds.length === 0) {
    return NextResponse.json(
      { error: "Aucun membre ne correspond à ce destinataire. Aucune notification n’a été envoyée." },
      { status: 404 }
    );
  }

  const lignes = membreIds.map((membreId) => ({
    membre_id: membreId,
    titre,
    message,
  }));
  for (let i = 0; i < lignes.length; i += 500) {
    const { error: insertionError } = await supabaseAdmin
      .from("notifications")
      .insert(lignes.slice(i, i + 500));
    if (insertionError) {
      console.error("Impossible d'enregistrer les notifications dans l'espace membre :", insertionError);
      return NextResponse.json(
        { error: "Impossible d’enregistrer les notifications dans les espaces membres." },
        { status: 500 }
      );
    }
  }

  const { data: jetons, error: jetonsError } = await supabaseAdmin
    .from("membre_fcm_tokens")
    .select("token")
    .in("membre_id", membreIds);
  if (jetonsError) {
    console.error("Les notifications sont enregistrées, mais les abonnements push n'ont pas pu être chargés :", jetonsError);
    return NextResponse.json({
      destinataires: membreIds.length,
      pushEnvoyees: 0,
      pushEchecs: 0,
      avertissement: "Les notifications sont dans les espaces membres, mais les notifications push n’ont pas pu être envoyées.",
    });
  }

  const listeJetons = (jetons ?? []).map((jeton) => jeton.token);
  if (listeJetons.length === 0) {
    return NextResponse.json({
      destinataires: membreIds.length,
      pushEnvoyees: 0,
      pushEchecs: 0,
      avertissement: "Aucun destinataire n’est abonné aux notifications push ; l’annonce est disponible dans les espaces membres.",
    });
  }

  let pushEnvoyees = 0;
  let pushEchecs = 0;
  try {
    const messaging = getAdminMessaging();
    for (let i = 0; i < listeJetons.length; i += 500) {
      const reponse = await messaging.sendEachForMulticast({
        tokens: listeJetons.slice(i, i + 500),
        notification: { title: titre, body: message },
      });
      pushEnvoyees += reponse.successCount;
      pushEchecs += reponse.failureCount;
    }

    return NextResponse.json({
      destinataires: membreIds.length,
      pushEnvoyees,
      pushEchecs,
    });
  } catch (error) {
    console.error("Les notifications sont enregistrées, mais l'envoi push a échoué :", error);
    return NextResponse.json({
      destinataires: membreIds.length,
      pushEnvoyees,
      pushEchecs: Math.max(pushEchecs, listeJetons.length - pushEnvoyees),
      avertissement: "L’annonce est dans les espaces membres, mais l’envoi push a échoué.",
    });
  }
}