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
  const [typeCible, setTypeCible] = useState<"tous" | "classe">("tous");
  const [classeCible, setClasseCible] = useState("");
  const [classes, setClasses] = useState<string[]>([]);
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

    const { count, error: abonnementsError } = await supabase
      .from("membre_fcm_tokens")
      .select("id", { count: "exact", head: true });
    if (abonnementsError) {
      setResultat("Impossible de charger le nombre d’abonnés aux notifications.");
      return;
    }
    setNombreAbonnes(count ?? 0);

    const { data: membres, error: membresError } = await supabase
      .from("membres")
      .select("classe")
      .order("classe", { ascending: true });
    if (membresError) {
      setResultat("Impossible de charger les classes disponibles.");
      return;
    }
    setClasses(
      [...new Set((membres ?? []).map((membre) => membre.classe.trim()).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b, "fr")
      )
    );

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
    if (typeCible === "classe" && !classeCible) {
      setResultat("Choisis une classe avant d’envoyer l’annonce.");
      return;
    }
    setEnvoi(true);
    setResultat(null);

    const { data: session } = await supabase.auth.getSession();
    const accessToken = session.session?.access_token;
    if (!accessToken) {
      setResultat("Ta session a expiré. Reconnecte-toi.");
      setEnvoi(false);
      router.replace("/admin");
      return;
    }

    try {
      const reponse = await fetch("/api/notifier", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          titre,
          message,
          typeCible,
          classe: typeCible === "classe" ? classeCible : null,
        }),
      });
      const data: unknown = await reponse.json();
      if (!data || typeof data !== "object") {
        throw new Error("Réponse invalide du serveur de notifications.");
      }
      const resultatEnvoi = data as {
        error?: unknown;
        destinataires?: unknown;
        pushEnvoyees?: unknown;
        pushEchecs?: unknown;
        avertissement?: unknown;
      };

      if (!reponse.ok) {
        setResultat(
          "Erreur : " +
            (typeof resultatEnvoi.error === "string"
              ? resultatEnvoi.error
              : "Échec de l'envoi")
        );
      } else {
        const destinataires =
          typeof resultatEnvoi.destinataires === "number" ? resultatEnvoi.destinataires : 0;
        const pushEnvoyees =
          typeof resultatEnvoi.pushEnvoyees === "number" ? resultatEnvoi.pushEnvoyees : 0;
        const cibleLabel =
          typeCible === "classe" ? `dans la classe ${classeCible}` : "au total";
        const avertissement =
          typeof resultatEnvoi.avertissement === "string"
            ? ` ${resultatEnvoi.avertissement}`
            : "";
        setResultat(
          `✅ Annonce enregistrée pour ${destinataires} membre(s) ${cibleLabel}. Notification push envoyée à ${pushEnvoyees} abonné(s).${avertissement}`
        );
        setTitre("");
        setMessage("");
        await chargerHistorique();
      }
    } catch (error) {
      setResultat(
        error instanceof Error ? error.message : "Une erreur inattendue est survenue lors de l’envoi."
      );
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
                maxLength={2000}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="destinataire">Destinataires</label>
              <select
                id="destinataire"
                value={typeCible}
                onChange={(e) => setTypeCible(e.target.value === "classe" ? "classe" : "tous")}
              >
                <option value="tous">Tous les membres</option>
                <option value="classe">Une classe précise</option>
              </select>
            </div>
            {typeCible === "classe" && (
              <div className="field">
                <label htmlFor="classe-cible">Classe destinataire</label>
                <select
                  id="classe-cible"
                  value={classeCible}
                  onChange={(e) => setClasseCible(e.target.value)}
                  required
                >
                  <option value="">Choisir une classe...</option>
                  {classes.map((classe) => (
                    <option key={classe} value={classe}>
                      {classe}
                    </option>
                  ))}
                </select>
                {classes.length === 0 && (
                  <p style={{ color: "#6b6656", fontSize: "0.85rem" }}>
                    Aucune classe n’est disponible.
                  </p>
                )}
              </div>
            )}
            <button type="submit" className="btn btn-primary" disabled={envoi}>
              {envoi
                ? "Envoi..."
                : typeCible === "classe"
                  ? "🔔 Envoyer à cette classe"
                  : "🔔 Envoyer à tous les membres"}
            </button>
            {resultat && (
              <p
                role="status"
                style={{
                  marginTop: 12,
                  color: resultat.startsWith("Erreur") || resultat.includes("expiré")
                    ? "#8a2d2d"
                    : "var(--emerald)",
                }}
              >
                {resultat}
              </p>
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