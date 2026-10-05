import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    return NextResponse.json({ error: "Connecte-toi avec ton compte membre." }, { status: 401 });
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
  const { data: membre, error: membreError } = await supabaseAdmin
    .from("membres")
    .select("id")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (membreError) {
    console.error("Impossible de retrouver la fiche membre pour son historique de paiements :", membreError);
    return NextResponse.json({ error: "Impossible de vérifier ta fiche membre." }, { status: 500 });
  }
  if (!membre) {
    return NextResponse.json({ error: "Aucune fiche membre n’est liée à ce compte." }, { status: 403 });
  }

  const { data: paiements, error: paiementsError } = await supabaseAdmin
    .from("paiements")
    .select("id, type_paiement, montant, methode, annee_scolaire, paye_le")
    .eq("membre_id", membre.id)
    .order("paye_le", { ascending: false })
    .limit(100);
  if (paiementsError) {
    console.error("Impossible de charger l'historique de paiements du membre connecté :", paiementsError);
    return NextResponse.json(
      { error: "Impossible de charger l’historique de tes paiements pour le moment." },
      { status: 500 }
    );
  }

  return NextResponse.json({ paiements: paiements ?? [] });
}
