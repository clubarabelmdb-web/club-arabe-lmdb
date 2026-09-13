"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

export default function CreerCompte() {
  const router = useRouter();
  const supabase = createClient();

  const [numeroMembre, setNumeroMembre] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [succes, setSucces] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");

    if (motDePasse.length < 6) {
      setErreur("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setEnCours(true);

    // 1. Crée le compte de connexion
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password: motDePasse,
    });

    if (signUpError || !data.user) {
      setErreur(signUpError?.message || "Impossible de créer le compte.");
      setEnCours(false);
      return;
    }

    // 2. Lie ce compte à la fiche membre correspondante
    const { error: lienError } = await supabase.rpc("lier_compte_membre", {
      numero_membre_param: numeroMembre.trim().toUpperCase(),
      email_param: email.trim(),
    });

    if (lienError) {
      setErreur(lienError.message);
      setEnCours(false);
      return;
    }

    setSucces(true);
    setTimeout(() => router.push("/membre"), 1500);
  }

  if (succes) {
    return (
      <main className="container section" style={{ maxWidth: 480 }}>
        <div className="card" style={{ borderColor: "var(--emerald)", background: "var(--emerald-soft)" }}>
          <p style={{ color: "#2f4b43" }}>
            Compte créé avec succès ! Redirection vers ton espace membre...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <section className="section" style={{ maxWidth: 420, margin: "0 auto" }}>
        <div className="container">
          <p className="eyebrow-line">Espace membre</p>
          <h1 style={{ fontSize: "1.7rem" }}>Créer mon compte</h1>
          <p style={{ color: "#6b6656" }}>
            Renseigne les mêmes informations que lors de ton inscription pour
            créer ton compte de connexion.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="numero">Numéro de membre</label>
              <input
                id="numero"
                value={numeroMembre}
                onChange={(e) => setNumeroMembre(e.target.value)}
                placeholder="CA-LMDB-0001"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="email">E-mail (le même que lors de l'inscription)</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="motDePasse">Choisir un mot de passe</label>
              <input
                id="motDePasse"
                type="password"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {erreur && <p style={{ color: "#8a2d2d", marginBottom: 16 }}>{erreur}</p>}
            <button type="submit" className="btn btn-primary" disabled={enCours}>
              {enCours ? "Création..." : "Créer mon compte"}
            </button>
          </form>
          <p style={{ marginTop: 16, fontSize: "0.9rem", color: "#6b6656" }}>
            Déjà un compte ? <Link href="/membre" style={{ color: "var(--emerald)" }}>Se connecter</Link>
          </p>
        </div>
      </section>
    </main>
  );
}