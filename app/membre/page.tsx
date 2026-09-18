"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabaseClient";
import { demanderPermissionEtObtenirJeton } from "@/lib/firebaseClient";

type Membre = {
  id: string;
  numero_membre: string;
  prenom: string;
  nom: string;
  classe: string;
  annee_scolaire: string;
  statut: string;
  photo_url: string | null;
};

export default function EspaceMembre() {
  const supabase = createClient();
  const [connecte, setConnecte] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [membre, setMembre] = useState<Membre | null>(null);
  const [erreur, setErreur] = useState("");
  const [notifStatut, setNotifStatut] = useState<"inactif" | "en_cours" | "actif" | "erreur">(
    "inactif"
  );

  useEffect(() => {
    verifier();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verifier() {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await chargerProfil(data.user.id);
      setConnecte(true);
    }
    setChargement(false);
  }

  async function chargerProfil(userId: string) {
    const { data: m } = await supabase
      .from("membres")
      .select("id, numero_membre, prenom, nom, classe, annee_scolaire, statut, photo_url")
      .eq("user_id", userId)
      .maybeSingle();
    if (m) setMembre(m as Membre);
  }

  async function activerNotifications() {
    if (!membre) return;
    setNotifStatut("en_cours");
    try {
      const jeton = await demanderPermissionEtObtenirJeton();
      if (!jeton) {
        setNotifStatut("erreur");
        return;
      }
      const { error } = await supabase
        .from("membre_fcm_tokens")
        .upsert({ membre_id: membre.id, token: jeton }, { onConflict: "token" });
      if (error) throw error;
      setNotifStatut("actif");
    } catch {
      setNotifStatut("erreur");
    }
  }

  async function connexion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur("");
    const formData = new FormData(e.currentTarget);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });
    if (error || !data.user) {
      setErreur("E-mail ou mot de passe incorrect.");
      return;
    }
    await chargerProfil(data.user.id);
    setConnecte(true);
  }

  async function deconnexion() {
    await supabase.auth.signOut();
    setConnecte(false);
    setMembre(null);
  }

  if (chargement) {
    return (
      <main className="container section">
        <p>Chargement...</p>
      </main>
    );
  }

  if (!connecte) {
    return (
      <main>
        <section className="section" style={{ maxWidth: 420, margin: "0 auto" }}>
          <div className="container">
            <p className="eyebrow-line">Espace membre</p>
            <h1 style={{ fontSize: "1.7rem" }}>Connexion</h1>
            <form onSubmit={connexion}>
              <div className="field">
                <label htmlFor="email">E-mail</label>
                <input id="email" name="email" type="email" required />
              </div>
              <div className="field">
                <label htmlFor="password">Mot de passe</label>
                <input id="password" name="password" type="password" required />
              </div>
              {erreur && <p style={{ color: "#8a2d2d", marginBottom: 16 }}>{erreur}</p>}
              <button type="submit" className="btn btn-primary">
                Se connecter
              </button>
            </form>
            <p style={{ marginTop: 16, fontSize: "0.9rem", color: "#6b6656" }}>
              Pas encore de compte ?{" "}
              <Link href="/membre/creer-compte" style={{ color: "var(--emerald)" }}>
                Créer mon compte
              </Link>
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!membre) {
    return (
      <main className="container section">
        <p style={{ color: "#6b6656" }}>Aucune fiche membre associée. Contacte le bureau.</p>
        <button className="btn btn-outline" onClick={deconnexion}>
          Se déconnecter
        </button>
      </main>
    );
  }

  return (
    <main>
      <section className="section">
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ fontSize: "1.9rem" }}>Bonjour {membre.prenom} !</h1>
            <button className="btn btn-outline" onClick={deconnexion}>
              Se déconnecter
            </button>
          </div>

          <div
            className="card"
            style={{
              marginTop: 24,
              maxWidth: 420,
              background: "var(--emerald-deep)",
              color: "var(--parchment)",
              borderColor: "var(--emerald-deep)",
            }}
          >
            <p style={{ color: "var(--gold-soft)", fontWeight: 700, marginBottom: 20 }}>
              CLUB ARABE — LMDB
            </p>
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              {membre.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={membre.photo_url}
                  alt={membre.prenom}
                  style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover" }}
                />
              )}
              <div style={{ background: "#fff", padding: 8 }}>
                <QRCodeSVG value={membre.numero_membre} size={92} />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700 }}>
                  {membre.prenom} {membre.nom}
                </p>
                <p style={{ margin: 0, color: "var(--gold-soft)" }}>{membre.classe}</p>
                <p style={{ margin: "8px 0 0", fontFamily: "monospace" }}>
                  {membre.numero_membre}
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            {notifStatut === "actif" ? (
              <p style={{ color: "var(--emerald)", fontWeight: 600 }}>
                🔔 Notifications activées
              </p>
            ) : (
              <button
                className="btn btn-gold"
                onClick={activerNotifications}
                disabled={notifStatut === "en_cours"}
              >
                {notifStatut === "en_cours" ? "Activation..." : "🔔 Activer les notifications"}
              </button>
            )}
            {notifStatut === "erreur" && (
              <p style={{ color: "#8a2d2d", marginTop: 8 }}>
                Impossible d'activer les notifications sur cet appareil/navigateur.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}