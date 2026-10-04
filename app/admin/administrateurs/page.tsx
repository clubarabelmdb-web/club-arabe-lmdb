"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

type Administrateur = {
  user_id: string;
  nom: string;
  email: string;
  role: "admin" | "super_admin";
  cree_le: string;
};

export default function GestionAdministrateurs() {
  const router = useRouter();
  const supabase = createClient();
  const [pret, setPret] = useState(false);
  const [administrateurs, setAdministrateurs] = useState<Administrateur[]>([]);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    chargerAdministrateurs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function envoyerRequete(url: string, options?: RequestInit) {
    const { data, error } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (error || !token) {
      router.replace("/admin");
      return null;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options?.headers ?? {}),
      },
    });
    const resultat = (await response.json()) as {
      administrateurs?: Administrateur[];
      error?: string;
      message?: string;
    };
    if (response.status === 401) {
      router.replace("/admin");
      return null;
    }
    if (response.status === 403) {
      router.replace("/admin/dashboard");
      return null;
    }
    if (!response.ok) throw new Error(resultat.error || "Une erreur est survenue.");
    return resultat;
  }

  async function chargerAdministrateurs() {
    try {
      const resultat = await envoyerRequete("/api/administrateurs");
      if (!resultat) return;
      setAdministrateurs(resultat.administrateurs ?? []);
    } catch (cause) {
      setErreur(cause instanceof Error ? cause.message : "Impossible de charger les administrateurs.");
    } finally {
      setPret(true);
    }
  }

  async function ajouterAdministrateur(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    setMessage("");
    if (password !== confirmation) {
      setErreur("Les deux mots de passe ne correspondent pas.");
      setEnvoi(false);
      return;
    }
    try {
      const resultat = await envoyerRequete("/api/administrateurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, email, password }),
      });
      if (!resultat) return;
      setMessage(resultat.message ?? "Administrateur ajouté.");
      setNom("");
      setEmail("");
      setPassword("");
      setConfirmation("");
      await chargerAdministrateurs();
    } catch (cause) {
      setErreur(cause instanceof Error ? cause.message : "Impossible d'ajouter cet administrateur.");
    } finally {
      setEnvoi(false);
    }
  }

  if (!pret) {
    return (
      <main className="container section">
        <p>Vérification des accès...</p>
      </main>
    );
  }

  return (
    <main>
      <section className="section" style={{ paddingBottom: 24 }}>
        <div className="container">
          <Link href="/admin/dashboard" style={{ color: "var(--emerald)", fontSize: "0.95rem" }}>
            ← Retour au tableau de bord
          </Link>
          <p className="eyebrow-line" style={{ marginTop: 16 }}>Espace administrateur</p>
          <h1 style={{ fontSize: "1.9rem" }}>Gérer les administrateurs</h1>
          <p style={{ color: "#6b6656" }}>
            Crée son accès directement ici : aucun e-mail ne sera envoyé. Si
            l’adresse a déjà un compte, le mot de passe sera remplacé par celui-ci.
          </p>
        </div>
      </section>

      <section className="container" style={{ maxWidth: 760 }}>
        <form className="card" onSubmit={ajouterAdministrateur}>
          <h2 style={{ marginTop: 0 }}>Ajouter un administrateur</h2>
          <div className="field">
            <label htmlFor="admin-nom">Nom</label>
            <input
              id="admin-nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              maxLength={120}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="admin-password">Mot de passe</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              maxLength={72}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="admin-password-confirmation">Confirmer le mot de passe</label>
            <input
              id="admin-password-confirmation"
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              minLength={8}
              maxLength={72}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="admin-email">Adresse e-mail</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={254}
              required
            />
          </div>
          {erreur && <p role="alert" style={{ color: "#8a2d2d" }}>{erreur}</p>}
          {message && <p role="status" style={{ color: "var(--emerald-deep)" }}>{message}</p>}
          <button type="submit" className="btn btn-primary" disabled={envoi}>
            {envoi ? "Ajout en cours..." : "Ajouter"}
          </button>
        </form>

        <h2 style={{ marginTop: 32 }}>Administrateurs actuels</h2>
        {administrateurs.length === 0 ? (
          <p style={{ color: "#6b6656" }}>Aucun administrateur trouvé.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {administrateurs.map((admin) => (
              <div key={admin.user_id} className="card">
                <p style={{ fontWeight: 600, margin: 0 }}>{admin.nom}</p>
                <p style={{ color: "#6b6656", margin: "4px 0 0" }}>{admin.email}</p>
                <p style={{ color: "#6b6656", margin: "4px 0 0" }}>
                  {admin.role === "super_admin" ? "Super-administrateur" : "Administrateur"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
