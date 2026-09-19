"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

export default function NotificationsAdmin() {
  const router = useRouter();
  const supabase = createClient();

  const [pret, setPret] = useState(false);
  const [titre, setTitre] = useState("");
  const [message, setMessage] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [resultat, setResultat] = useState<string | null>(null);
  const [nombreAbonnes, setNombreAbonnes] = useState<number | null>(null);
  const [historique, setHistorique] = useState<{ titre: string; message: string; cree_le: string }[]>(
    []
  );

  useEffect(() => {
    verifierAccesEtCharger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verifierAccesEtCharger() {
    const { data: session } = await supabase.auth.getUser();
    if (!session.user) {
      router.push("/admin");
      return;
    }
    const { data: admin } = await supabase
      .from("administrateurs")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (!admin) {
      router.push("/admin");
      return;
    }

    const { count } = await supabase
      .from("membre_fcm_tokens")
      .select("id", { count: "exact", head: true });
    setNombreAbonnes(count ?? 0);

    await chargerHistorique();
    setPret(true);
  }

  async function chargerHistorique() {
    const { data } = await supabase
      .from("notifications")
      .select("titre, message, cree_le")
      .order("cree_le", { ascending: false });

    const vues = new Set<string>();
    const uniques: { titre: string; message: string; cree_le: string }[] = [];
    for (const n of data ?? []) {
      const cle = `${n.titre}|${n.message}|${n.cree_le}`;
      if (!vues.has(cle)) {
        vues.add(cle);
        uniques.push(n);
      }
    }
    setHistorique(uniques);
  }

  async function supprimerNotification(n: { titre: string; message: string; cree_le: string }) {
    const confirmation = window.confirm("Supprimer cette notification pour tous les membres ?");
    if (!confirmation) return;

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("titre", n.titre)
      .eq("message", n.message)
      .eq("cree_le", n.cree_le);

    if (error) alert("Erreur : " + error.message);
    await chargerHistorique();
  }

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setResultat(null);

    const { data: session } = await supabase.auth.getSession();
    const accessToken = session.session?.access_token;

    try {
      const reponse = await fetch("/api/notifier", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ titre, message }),
      });
      const data = await reponse.json();

      if (!reponse.ok) {
        setResultat("Erreur : " + (data.error || "Échec de l'envoi"));
      } else if (data.envoyes === 0) {
        setResultat("Aucun membre abonné aux notifications pour le moment.");
      } else {
        setResultat(`✅ Notification envoyée à ${data.envoyes} membre(s).`);
        setTitre("");
        setMessage("");
        await chargerHistorique();
      }
    } catch {
      setResultat("Erreur lors de l'envoi.");
    }
    setEnvoi(false);
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
      <section className="section">
        <div className="container" style={{ maxWidth: 560 }}>
          <Link href="/admin/dashboard" style={{ color: "var(--emerald)", fontSize: "0.95rem" }}>
            ← Retour au tableau de bord
          </Link>
          <p className="eyebrow-line" style={{ marginTop: 16 }}>
            Espace administrateur
          </p>
          <h1 style={{ fontSize: "1.9rem" }}>Envoyer une notification</h1>
          <p style={{ color: "#6b6656" }}>
            {nombreAbonnes} membre{nombreAbonnes === 1 ? "" : "s"} abonné
            {nombreAbonnes === 1 ? "" : "s"} aux notifications.
          </p>

          <form onSubmit={envoyer} className="card">
            <div className="field">
              <label htmlFor="titre">Titre</label>
              <input
                id="titre"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="ex : Nouvelle activité !"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={envoi}>
              {envoi ? "Envoi..." : "🔔 Envoyer à tous les abonnés"}
            </button>
            {resultat && (
              <p style={{ marginTop: 12, color: "var(--emerald)" }}>{resultat}</p>
            )}
          </form>

          <h2 style={{ fontSize: "1.2rem", marginTop: 40 }}>Historique des envois</h2>
          {historique.length === 0 ? (
            <p style={{ color: "#6b6656" }}>Aucune notification envoyée pour le moment.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {historique.map((n) => (
                <div
                  key={`${n.titre}-${n.cree_le}`}
                  className="card"
                  style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}
                >
                  <div>
                    <p style={{ fontWeight: 600, margin: 0 }}>{n.titre}</p>
                    <p style={{ color: "#4a463d", margin: "4px 0 0" }}>{n.message}</p>
                    <p style={{ color: "#6b6656", fontSize: "0.8rem", margin: "8px 0 0" }}>
                      {new Date(n.cree_le).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <button className="btn btn-outline" onClick={() => supprimerNotification(n)}>
                    🗑️ Supprimer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}