import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const { membreId } = await request.json();
    if (!membreId) {
      return NextResponse.json({ error: "membreId manquant" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // Récupère la fiche membre (accès total car client admin)
    const { data: membre, error: membreError } = await supabaseAdmin
      .from("membres")
      .select("id, email, user_id, prenom, nom")
      .eq("id", membreId)
      .single();

    if (membreError || !membre) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }

    if (membre.user_id) {
      return NextResponse.json({ message: "Compte déjà créé" }, { status: 200 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

    // Crée le compte et envoie l'e-mail d'invitation (via le système d'e-mail
    // intégré de Supabase, aucun domaine personnalisé requis)
    const { data: invitation, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(membre.email, {
        redirectTo: `${siteUrl}/membre/definir-mot-de-passe`,
      });

    if (inviteError || !invitation.user) {
      return NextResponse.json(
        { error: inviteError?.message || "Échec de l'invitation" },
        { status: 500 }
      );
    }

    // Lie le nouveau compte à la fiche membre
    const { error: updateError } = await supabaseAdmin
      .from("membres")
      .update({ user_id: invitation.user.id })
      .eq("id", membre.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur inconnue" }, { status: 500 });
  }
}