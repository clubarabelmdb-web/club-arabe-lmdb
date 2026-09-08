"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function AdminLogin() {
  const router = useRouter();
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setChargement(true);
    setErreur("");

    const formData = new FormData(e.currentTarget);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });

    if (error || !data.user) {
      setErreur("E-mail ou mot de passe incorrect.");
      setChargement(false);
      return;
    }

    const { data: admin } = await supabase
      .from("administrateurs")
      .select("id")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (!admin) {
      setErreur("Ce compte n'a pas les droits administrateur.");
      await supabase.auth.signOut();
      setChargement(false);
      return;
    }

    router.push("/admin/dashboard");
  }

  return (
    <main>
      <section className="section" style={{ maxWidth: 420, margin: "0 auto" }}>
        <div className="container">
          <p className="eyebrow-line">Espace administrateur</p>
          <h1 style={{ fontSize: "1.7rem" }}>Connexion</h1>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input id="email" name="email" type="email" required />
            </div>
            <div className="field">
              <label htmlFor="password">Mot de passe</label>
              <input id="password" name="password" type="password" required />
            </div>
            {erreur && <p style={{ color: "#8a2d2d", marginBottom: 16 }}>{erreur}</p>}
            <button type="submit" className="btn btn-primary" disabled={chargement}>
              {chargement ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
