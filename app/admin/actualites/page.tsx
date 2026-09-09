"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

type Actualite = {
  id: string;
  titre: string;
  description: string;
  image_url: string | null;
  auteur: string | null;
  publie_le: string;
};

export default function ActualitesAdmin() {
  const router = useRouter();
  const supabase = createClient();

  const [pret, setPret] = useState(false);
  const [actualites, setActualites] = useState<Actualite[]>([]);
  const [publication, setPublication] = useState(false);

  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [auteur, setAuteur] = useState("");
  const [image, setImage] = useState<File | null>(null);

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
    await chargerActualites();
    setPret(true);
  }

  async function chargerActualites() {
    const { data } = await supabase
      .from("actualites")
      .select("*")
      .order("publie_le", { ascending: false });
    setActualites((data as Actualite[]) ?? []);
  }

  async function publier(e: React.FormEvent) {
    e.preventDefault();
    if (!titre.trim() || !description.trim()) return;
    setPublication(true);

    try {
      let imageUrl: string | null = null;

      if (image) {
        const chemin = `${Date.now()}-${image.name}`;
        const { error: uploadError } = await supabase.storage
          .from("galerie")
          .upload(chemin, image);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("galerie").getPublicUrl(chemin);
        imageUrl = data.publicUrl;
      }

      const { error } = await supabase.from("actualites").insert({
        titre: titre.trim(),
        description: description.trim(),
        auteur: auteur.trim() || null,
        image_url: imageUrl,
      });
      if (error) throw error;

      setTitre("");
      setDescription("");
      setAuteur("");
      setImage(null);
      await chargerActualites();
    } catch (err: any) {
      alert("Erreur : " + err.message);
    }
    setPublication(false);
  }

  async function supprimer(id: string, titreActualite: string) {
    const confirmation = window.confirm(`Supprimer l'actualité "${titreActualite}" ?`);
    if (!confirmation) return;
    const { error } = await supabase.from("actualites").delete().eq("id", id);
    if (error) alert("Erreur : " + error.message);
    await chargerActualites();
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
          <h1 style={{ fontSize: "1.9rem" }}>Publier une actualité</h1>
        </div>
      </section>

      {/* FORMULAIRE */}
      <section className="container">
        <form onSubmit={publier} className="card">
          <div className="field">
            <label htmlFor="titre">Titre</label>
            <input
              id="titre"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="ex : Ouverture des inscriptions"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="auteur">Auteur (facultatif)</label>
              <input id="auteur" value={auteur} onChange={(e) => setAuteur(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="image">Image (facultatif)</label>
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={publication}>
            {publication ? "Publication..." : "+ Publier l'actualité"}
          </button>
        </form>
      </section>

      {/* LISTE */}
      <section className="section">
        <div className="container">
          <h2 style={{ fontSize: "1.2rem" }}>Actualités publiées</h2>
          {actualites.length === 0 ? (
            <p style={{ color: "#6b6656" }}>Aucune actualité pour le moment.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {actualites.map((a) => (
                <div key={a.id} className="card" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                  <div style={{ display: "flex", gap: 14 }}>
                    {a.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.image_url}
                        alt={a.titre}
                        style={{ width: 72, height: 72, objectFit: "cover", flexShrink: 0 }}
                      />
                    )}
                    <div>
                      <p style={{ fontWeight: 600, margin: 0 }}>{a.titre}</p>
                      <p style={{ color: "#6b6656", margin: 0 }}>
                        {new Date(a.publie_le).toLocaleDateString("fr-FR")}
                        {a.auteur ? ` · ${a.auteur}` : ""}
                      </p>
                      <p style={{ color: "#4a463d", margin: "4px 0 0" }}>
                        {a.description.slice(0, 100)}
                        {a.description.length > 100 ? "…" : ""}
                      </p>
                    </div>
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