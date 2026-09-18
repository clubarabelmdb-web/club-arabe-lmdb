import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminMessaging } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: admin } = await supabase
      .from("administrateurs")
      .select("id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!admin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { titre, message } = await request.json();
    if (!titre || !message) {
      return NextResponse.json({ error: "Titre et message requis" }, { status: 400 });
    }

    const { data: jetons } = await supabase.from("membre_fcm_tokens").select("token");
    const listeJetons = (jetons ?? []).map((j) => j.token);

    if (listeJetons.length === 0) {
      return NextResponse.json({ envoyes: 0, message: "Aucun abonné pour le moment" });
    }

    const messaging = getAdminMessaging();
    const reponse = await messaging.sendEachForMulticast({
      tokens: listeJetons,
      notification: { title: titre, body: message },
    });

    return NextResponse.json({ envoyes: reponse.successCount, echecs: reponse.failureCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur inconnue" }, { status: 500 });
  }
}