import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabaseAdmin";

async function verifierSuperAdmin(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) {
    return { response: NextResponse.json({ error: "Connexion requise." }, { status: 401 }) };
  }
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return {
      response: NextResponse.json(
        { error: "La configuration serveur Supabase est incomplète." },
        { status: 500 }
      ),
    };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return { response: NextResponse.json({ error: "Session invalide." }, { status: 401 }) };
  }

  const supabaseAdmin = createAdminClient();
  const { data: admin, error } = await supabaseAdmin
    .from("administrateurs")
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (error) {
    return {
      response: NextResponse.json(
        { error: "Impossible de vérifier les droits administrateur." },
        { status: 500 }
      ),
    };
  }
  if (admin?.role !== "super_admin") {
    return {
      response: NextResponse.json(
        { error: "Seul un super-administrateur peut gérer les administrateurs." },
        { status: 403 }
      ),
    };
  }

  return { supabaseAdmin };
}

export async function GET(request: NextRequest) {
  const verification = await verifierSuperAdmin(request);
  if ("response" in verification) return verification.response;

  const { data: administrateurs, error } = await verification.supabaseAdmin
    .from("administrateurs")
    .select("user_id, nom, role, cree_le")
    .order("cree_le", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Impossible de charger les administrateurs." },
      { status: 500 }
    );
  }

  const liste = await Promise.all(
    (administrateurs ?? []).map(async (admin) => {
      const { data, error: utilisateurError } =
        await verification.supabaseAdmin.auth.admin.getUserById(admin.user_id);
      return {
        admin,
        email: data.user?.email ?? "",
        error: utilisateurError || (!data.user ? new Error("Utilisateur introuvable.") : null),
      };
    })
  );

  if (liste.some((resultat) => resultat.error)) {
    return NextResponse.json(
      { error: "Impossible de charger les adresses e-mail des administrateurs." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    administrateurs: liste.map(({ admin, email }) => ({ ...admin, email })),
  });
}

export async function POST(request: NextRequest) {
  const verification = await verifierSuperAdmin(request);
  if ("response" in verification) return verification.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const donnees = body as { nom?: unknown; email?: unknown };
  const nom = typeof donnees.nom === "string" ? donnees.nom.trim() : "";
  const email = typeof donnees.email === "string" ? donnees.email.trim().toLowerCase() : "";
  if (
    !nom ||
    nom.length > 120 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return NextResponse.json(
      { error: "Saisis un nom et une adresse e-mail valides." },
      { status: 400 }
    );
  }

  const { supabaseAdmin } = verification;
  let userId: string | undefined;
  for (let page = 1; page <= 100; page++) {
    const { data: utilisateurs, error: listeError } =
      await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (listeError) {
      return NextResponse.json(
        { error: "Impossible de vérifier l'adresse e-mail." },
        { status: 500 }
      );
    }
    const utilisateurExistant = utilisateurs.users.find(
      (utilisateur) => utilisateur.email?.toLowerCase() === email
    );
    if (utilisateurExistant) {
      userId = utilisateurExistant.id;
      break;
    }
    if (utilisateurs.users.length < 1000) break;
  }

  let utilisateurInvite = false;

  if (userId) {
    const { data: adminExistant, error: adminExistantError } = await supabaseAdmin
      .from("administrateurs")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (adminExistantError) {
      return NextResponse.json(
        { error: "Impossible de vérifier les droits existants." },
        { status: 500 }
      );
    }
    if (adminExistant) {
      return NextResponse.json(
        { error: "Cette adresse est déjà administratrice." },
        { status: 409 }
      );
    }
  } else {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    const { data: invitation, error: invitationError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${siteUrl}/membre/definir-mot-de-passe?destination=admin`,
        data: { full_name: nom },
      });
    if (invitationError || !invitation.user) {
      return NextResponse.json(
        { error: invitationError?.message || "Impossible d'envoyer l'invitation." },
        { status: 500 }
      );
    }
    userId = invitation.user.id;
    utilisateurInvite = true;
  }

  if (!userId) {
    return NextResponse.json(
      { error: "Impossible d'identifier le compte administrateur." },
      { status: 500 }
    );
  }

  const { error: insertionError } = await supabaseAdmin.from("administrateurs").insert({
    user_id: userId,
    nom,
    role: "admin",
  });
  if (insertionError) {
    if (utilisateurInvite && userId) {
      const { error: suppressionError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (suppressionError) {
        console.error("Impossible d'annuler le compte admin invité :", suppressionError.message);
      }
    }
    return NextResponse.json(
      { error: "Le compte n'a pas pu être ajouté aux administrateurs." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: utilisateurInvite
      ? "Invitation envoyée. L'administrateur devra choisir son mot de passe."
      : "L'administrateur a été ajouté. Il peut se connecter avec son compte existant.",
  });
}
