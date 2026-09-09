"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabaseClient";

type Membre = {
  numero_membre: string;
  prenom: string;
  nom: string;
  classe: string;
  annee_scolaire: string;
  statut: string;
  photo_url: string | null;
};

type Notification = {
  id: string;
  titre: string;
  message: string;
  cree_le: string;
  lue: boolean;
};

export default function EspaceMembre() {
  const supabase = createClient();
  const [connecte, setConnecte] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [membre, setMembre] = useState<Membre | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [erreur, setErreur] = useState("");

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
      .select("numero_membre, prenom, nom, classe, annee_scolaire, statut, photo_url, id")
      .eq("user_id", userId)
      .maybeSingle();

    if (m) {
      setMembre(m as Membre);
      const { data: notifs } = await supabase
        .from("notifications")
        .select("*")
        .eq("membre_id", (m as any).id)
        .order("cree_le", { ascending: false });
      setNotifications((notifs as Notification[]) ?? []);
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
            <p style={{ color: "#6b6656" }}>
              Un compte est créé automatiquement dès que ton inscription est
              validée. Utilise l'e-mail fourni lors de l'inscription.
            </p>
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
          </div>
        </section>
      </main>
    );
  }

  if (!membre) {
    return (
      <main className="container section">
        <p style={{ color: "#6b6656" }}>
          Aucune fiche membre n'est encore associée à ce compte. Contacte
          l'administration du club.
        </p>
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
            <div>
              <p className="eyebrow-line">Espace membre</p>
              <h1 style={{ fontSize: "1.9rem" }}>
                Bonjour {membre.prenom} !
              </h1>
            </div>
            <button className="btn btn-outline" onClick={deconnexion}>
              Se déconnecter
            </button>
          </div>

          <div className="grid-2" style={{ marginTop: 32, alignItems: "start" }}>
            {/* CARTE DE MEMBRE */}
            <div
              className="card"
              style={{
                background: "var(--emerald-deep)",
                color: "var(--parchment)",
                borderColor: "var(--emerald-deep)",
              }}
            >
              <p style={{ color: "var(--gold-soft)", fontWeight: 700, letterSpacing: "0.04em", marginBottom: 2 }}>
                CLUB ARABE
              </p>
              <p style={{ color: "var(--gold-soft)", fontSize: "0.85rem", marginBottom: 20 }}>
                Lycée Maba Diakhou Ba
              </p>

              <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                {membre.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={membre.photo_url}
                    alt={`${membre.prenom} ${membre.nom}`}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid var(--gold-soft)",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      background: "var(--gold-soft)",
                      color: "var(--emerald-deep)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "1.3rem",
                      flexShrink: 0,
                    }}
                  >
                    {membre.prenom[0]}
                    {membre.nom[0]}
                  </div>
                )}
                <div style={{ background: "#fff", padding: 8, display: "inline-block" }}>
                  <QRCodeSVG value={membre.numero_membre} size={92} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>
                    {membre.prenom} {membre.nom}
                  </p>
                  <p style={{ margin: 0, color: "var(--gold-soft)" }}>{membre.classe}</p>
                  <p style={{ margin: "8px 0 0", fontFamily: "monospace", fontSize: "1rem" }}>
                    {membre.numero_membre}
                  </p>
                  <p style={{ margin: "8px 0 0", fontSize: "0.85rem", color: "var(--gold-soft)" }}>
                    Année {membre.annee_scolaire} · Statut : {membre.statut === "actif" ? "Membre actif" : "Inactif"}
                  </p>
                </div>
              </div>
            </div>

            {/* NOTIFICATIONS */}
            <div>
              <h2 style={{ fontSize: "1.2rem" }}>Notifications</h2>
              {notifications.length === 0 ? (
                <p style={{ color: "#6b6656" }}>Aucune notification pour le moment.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {notifications.map((n) => (
                    <div key={n.id} className="card">
                      <p style={{ fontWeight: 600, margin: 0 }}>{n.titre}</p>
                      <p style={{ color: "#4a463d", margin: 0 }}>{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}