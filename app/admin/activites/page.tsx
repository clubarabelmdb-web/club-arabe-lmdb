"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

type Activite = {
  id: string;
  titre: string;
  description: string | null;
  date_activite: string;
  heure: string | null;
  lieu: string | null;
  affiche_url: string | null;
  programme: string | null;
};

export default function ActivitesAdmin() {
  const router = useRouter();
  const supabase = createClient();

  const [pret, setPret] = useState(false);
  const [activites, setActivites] = useState<Activite[]>([]);
  const [creation, setCreation] = useState(false);

  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [dateActivite, setDateActivite] = useState("");
  const [heure, setHeure] = useState("");
  const [lieu, setLieu] = useState("");
  const [programme, setProgramme] = useState("");
  const [affiche, setAffiche] = useState<File | null>(null);

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
    await chargerActivites();
    setPret(true);
  }

  async function chargerActivites() {
    const { data } = await supabase
      .from("activites")
      .select("*")
      .order("date_activite", { ascending: false });
    setActivites((data as Activite[]) ?? []);
  }

  async function creerActivite(e: React.FormEvent) {
    e.preventDefault();
    if (!titre.trim() || !dateActivite) return;
    setCreation(true);

    try {
      let afficheUrl: string | null = null;

      if (affiche) {
        const chemin = `${Date.now()}-${affiche.name}`;
        const { error: uploadError } = await supabase.storage
          .from("galerie")
          .upload(chemin, affiche);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("galerie").getPublicUrl(chemin);
        afficheUrl = data.publicUrl;
      }

      const { error } = await supabase.from("activites").insert({
        titre: titre.trim(),
        description: description.trim() || null,
        date_activite: dateActivite,
        heure: heure.trim() || null,
        lieu: lieu.trim() || null,
        programme: programme.trim() || null,
        affiche_url: afficheUrl,
      });
      if (error) throw error;

      setTitre("");
      setDescription("");
      setDateActivite("");
      setHeure("");
      setLieu("");
      setProgramme("");
      setAffiche(null);
      await chargerActivites();
    } catch (err: any) {
      alert("Erreur : " + err.message);
    }
    setCreation(false);
  }

  async function supprimer(id: string, titreActivite: string) {
    const confirmation = window.confirm(`Supprimer l'activité "${titreActivite}" ?`);
    if (!confirmation) return;
    const { error } = await supabase.from("activites").delete().eq("id", id);
    if (error) alert("Erreur : " + error.message);
    await chargerActivites();
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
          <p className="eyebrow-line" style={{ marginTop: 16 }}>
            Espace administrateur
          </p>
          <h1 style={{ fontSize: "1.9rem" }}>Activités et événements</h1>
        </div>
      </section>

      {/* FORMULAIRE */}
      <section className="container">
        <form onSubmit={creerActivite} className="card">
          <h2 style={{ fontSize: "1.15rem", marginBottom: 16 }}>Créer un événement</h2>
          <div className="field">
            <label htmlFor="titre">Titre</label>
            <input
              id="titre"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="ex : Journée Arabe 2027"
              required
            />
          </div>

          <div className="grid-2">
            <div className="field">
              <label htmlFor="date">Date</label>
              <input
                id="date"
                type="date"
                value={dateActivite}
                onChange={(e) => setDateActivite(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="heure">Heure (facultatif)</label>
              <input
                id="heure"
                value={heure}
                onChange={(e) => setHeure(e.target.value)}
                placeholder="ex : 15h00"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="lieu">Lieu (facultatif)</label>
            <input id="lieu" value={lieu} onChange={(e) => setLieu(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="description">Description (facultatif)</label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="programme">Programme (facultatif)</label>
            <textarea
              id="programme"
              rows={3}
              value={programme}
              onChange={(e) => setProgramme(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="affiche">Affiche (facultatif)</label>
            <input
              id="affiche"
              type="file"
              accept="image/*"
              onChange={(e) => setAffiche(e.target.files?.[0] ?? null)}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={creation}>
            {creation ? "Création..." : "+ Créer l'événement"}
          </button>
        </form>
      </section>

      {/* LISTE */}
      <section className="section">
        <div className="container">
          <h2 style={{ fontSize: "1.2rem" }}>Événements créés</h2>
          {activites.length === 0 ? (
            <p style={{ color: "#6b6656" }}>Aucun événement pour le moment.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {activites.map((a) => (
                <div key={a.id} className="card" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: 0 }}>{a.titre}</p>
                    <p style={{ color: "#6b6656", margin: 0 }}>
                      {new Date(a.date_activite).toLocaleDateString("fr-FR")}
                      {a.heure ? ` · ${a.heure}` : ""}
                      {a.lieu ? ` · ${a.lieu}` : ""}
                    </p>
                  </div>
                  <button className="btn btn-outline" onClick={() => supprimer(a.id, a.titre)}>
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