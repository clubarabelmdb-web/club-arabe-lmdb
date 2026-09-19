import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";

function genererMotDePasse(): string {
  const caracteres = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let mdp = "";
  for (let i = 0; i < 8; i++) {
    mdp += caracteres[Math.floor(Math.random() * caracteres.length)];
  }
  return mdp;
}

export async function POST(request: NextRequest) {
  try {
    const { membreId } = await request.json();
    if (!membreId) {
      return NextResponse.json({ error: "membreId manquant" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const { data: membre, error: membreError } = await supabaseAdmin
      .from("membres")
      .select("id, email, user_id")
      .eq("id", membreId)
      .single();

    if (membreError || !membre) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }

    if (membre.user_id) {
      return NextResponse.json({ dejaExistant: true });
    }

    const motDePasse = genererMotDePasse();

    const { data: nouvelUtilisateur, error: creationError } =
      await supabaseAdmin.auth.admin.createUser({
        email: membre.email,
        password: motDePasse,
        email_confirm: true,
      });

    if (creationError || !nouvelUtilisateur.user) {
      return NextResponse.json(
        { error: creationError?.message || "Échec de la création du compte" },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("membres")
      .update({ user_id: nouvelUtilisateur.user.id })
      .eq("id", membre.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ motDePasse });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur inconnue" }, { status: 500 });
  }
}