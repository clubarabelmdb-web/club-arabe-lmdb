"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

type Photo = {
  id: string;
  url: string;
  legende: string | null;
};

type Album = {
  id: string;
  titre: string;
  description: string | null;
  photos: Photo[];
};

export default function GaleriAdmin() {
  const router = useRouter();
  const supabase = createClient();

  const [pret, setPret] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumOuvert, setAlbumOuvert] = useState<string | null>(null);
  const [nouveauTitre, setNouveauTitre] = useState("");
  const [nouvelleDescription, setNouvelleDescription] = useState("");
  const [creation, setCreation] = useState(false);
  const [uploadEnCours, setUploadEnCours] = useState<string | null>(null);

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

    await chargerAlbums();
    setPret(true);
  }

  async function chargerAlbums() {
    const { data: albumsData } = await supabase
      .from("albums")
      .select("id, titre, description")
      .order("cree_le", { ascending: false });

    if (!albumsData) {
      setAlbums([]);
      return;
    }

    const albumsAvecPhotos = await Promise.all(
      albumsData.map(async (album) => {
        const { data: photos } = await supabase
          .from("photos")
          .select("id, url, legende")
          .eq("album_id", album.id)
          .order("ajoutee_le", { ascending: false });
        return { ...album, photos: photos ?? [] };
      })
    );

    setAlbums(albumsAvecPhotos);
  }

  async function creerAlbum(e: React.FormEvent) {
    e.preventDefault();
    if (!nouveauTitre.trim()) return;
    setCreation(true);

    const { error } = await supabase.from("albums").insert({
      titre: nouveauTitre.trim(),
      description: nouvelleDescription.trim() || null,
    });

    if (error) alert("Erreur : " + error.message);
    setNouveauTitre("");
    setNouvelleDescription("");
    await chargerAlbums();
    setCreation(false);
  }

  async function supprimerAlbum(id: string, titre: string) {
    const confirmation = window.confirm(
      `Supprimer l'album "${titre}" et toutes ses photos ? Cette action est irréversible.`
    );
    if (!confirmation) return;

    const { error } = await supabase.from("albums").delete().eq("id", id);
    if (error) alert("Erreur : " + error.message);
    await chargerAlbums();
  }

  async function ajouterPhotos(albumId: string, files: FileList) {
    setUploadEnCours(albumId);
    try {
      for (const file of Array.from(files)) {
        const chemin = `${albumId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("galerie")
          .upload(chemin, file);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("galerie").getPublicUrl(chemin);

        const { error: insertError } = await supabase.from("photos").insert({
          album_id: albumId,
          url: data.publicUrl,
        });
        if (insertError) throw insertError;
      }

      await chargerAlbums();
    } catch (err: any) {
      alert("Erreur lors de l'ajout d'une photo : " + err.message);
    }
    setUploadEnCours(null);
  }

  async function supprimerPhoto(photoId: string) {
    const { error } = await supabase.from("photos").delete().eq("id", photoId);
    if (error) alert("Erreur : " + error.message);
    await chargerAlbums();
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
          <h1 style={{ fontSize: "1.9rem" }}>Gérer la galerie</h1>
        </div>
      </section>

      {/* CRÉER UN ALBUM */}
      <section className="container">
        <form onSubmit={creerAlbum} className="card">
          <h2 style={{ fontSize: "1.15rem", marginBottom: 16 }}>Créer un nouvel album</h2>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="titre">Titre de l'album</label>
              <input
                id="titre"
                value={nouveauTitre}
                onChange={(e) => setNouveauTitre(e.target.value)}
                placeholder="ex : Journée Arabe 2026"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="description">Description (facultatif)</label>
              <input
                id="description"
                value={nouvelleDescription}
                onChange={(e) => setNouvelleDescription(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={creation}>
            {creation ? "Création..." : "+ Créer l'album"}
          </button>
        </form>
      </section>

      <section className="section">
        <div className="container">
          {albums.length === 0 ? (
            <p style={{ color: "#6b6656" }}>Aucun album pour le moment. Crée le premier ci-dessus.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {albums.map((album) => (
                <div key={album.id} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <h2 style={{ fontSize: "1.1rem", margin: 0 }}>{album.titre}</h2>
                      {album.description && (
                        <p style={{ color: "#6b6656", margin: "4px 0 0" }}>{album.description}</p>
                      )}
                      <p style={{ color: "#6b6656", margin: "4px 0 0", fontSize: "0.9rem" }}>
                        {album.photos.length} photo{album.photos.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setAlbumOuvert(albumOuvert === album.id ? null : album.id)}
                      >
                        {albumOuvert === album.id ? "Fermer" : "Voir les photos"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => supprimerAlbum(album.id, album.titre)}
                      >
                        Supprimer l'album
                      </button>
                    </div>
                  </div>

                  {albumOuvert === album.id && (
                    <div style={{ marginTop: 20, borderTop: "1px solid var(--line)", paddingTop: 20 }}>
                      <label className="btn btn-gold" style={{ cursor: "pointer" }}>
                        {uploadEnCours === album.id ? "Envoi..." : "+ Ajouter des images"}
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          style={{ display: "none" }}
                          disabled={uploadEnCours === album.id}
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files && files.length > 0) ajouterPhotos(album.id, files);
                            e.target.value = "";
                          }}
                        />
                      </label>

                      {album.photos.length === 0 ? (
                        <p style={{ color: "#6b6656", marginTop: 16 }}>Aucune photo dans cet album.</p>
                      ) : (
                        <div className="grid-4" style={{ marginTop: 16 }}>
                          {album.photos.map((photo) => (
                            <div key={photo.id} style={{ position: "relative" }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={photo.url}
                                alt={photo.legende ?? album.titre}
                                style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }}
                              />
                              <button
                                type="button"
                                onClick={() => supprimerPhoto(photo.id)}
                                aria-label="Supprimer cette image"
                                style={{
                                  position: "absolute",
                                  top: 6,
                                  right: 6,
                                  background: "rgba(20,20,20,0.75)",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: 3,
                                  padding: "4px 8px",
                                  cursor: "pointer",
                                  fontSize: "0.8rem",
                                }}
                              >
                                Supprimer
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}