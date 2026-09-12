"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function DefinirMotDePasse() {
  const router = useRouter();
  const supabase = createClient();

  const [pret, setPret] = useState(false);
  const [sessionValide, setSessionValide] = useState(false);
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [succes, setSucces] = useState(false);

  useEffect(() => {
    // Le lien reçu par e-mail contient les informations de session dans
    // l'adresse ; le client Supabase les détecte automatiquement.
    supabase.auth.getSession().then(({ data }) => {
      setSessionValide(!!data.session);
      setPret(true);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");

    if (motDePasse.length < 6) {
      setErreur("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (motDePasse !== confirmation) {
      setErreur("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setEnCours(true);
    const { error } = await supabase.auth.updateUser({ password: motDePasse });
    setEnCours(false);

    if (error) {
      setErreur(error.message);
      return;
    }

    setSucces(true);
    setTimeout(() => router.push("/membre"), 2000);
  }

  if (!pret) {
    return (
      <main className="container section">
        <p>Chargement...</p>
      </main>
    );
  }

  if (!sessionValide) {
    return (
      <main className="container section" style={{ maxWidth: 480 }}>
        <p className="eyebrow-line">Espace membre</p>
        <h1 style={{ fontSize: "1.7rem" }}>Lien invalide ou expiré</h1>
        <p style={{ color: "#6b6656" }}>
          Ce lien n'est plus valide. Demande à l'administration du club de te
          renvoyer une invitation, ou connecte-toi si tu as déjà défini ton mot
          de passe.
        </p>
      </main>
    );
  }

  if (succes) {
    return (
      <main className="container section" style={{ maxWidth: 480 }}>
        <div className="card" style={{ borderColor: "var(--emerald)", background: "var(--emerald-soft)" }}>
          <p style={{ color: "#2f4b43" }}>
            Mot de passe défini avec succès ! Redirection vers ton espace
            membre...
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
          <h1 style={{ fontSize: "1.7rem" }}>Choisis ton mot de passe</h1>
          <p style={{ color: "#6b6656" }}>
            Bienvenue au Club Arabe ! Choisis un mot de passe pour accéder à ton
            espace membre.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="motDePasse">Mot de passe</label>
              <input
                id="motDePasse"
                type="password"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="field">
              <label htmlFor="confirmation">Confirmer le mot de passe</label>
              <input
                id="confirmation"
                type="password"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {erreur && <p style={{ color: "#8a2d2d", marginBottom: 16 }}>{erreur}</p>}
            <button type="submit" className="btn btn-primary" disabled={enCours}>
              {enCours ? "Enregistrement..." : "Valider mon mot de passe"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}