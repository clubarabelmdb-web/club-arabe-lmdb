"use client";

import { useEffect, useState } from "react";
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

export default function GaleriePage() {
  const supabase = createClient();

  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumOuvert, setAlbumOuvert] = useState<string | null>(null);

  useEffect(() => {
    chargerAlbums();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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


  return (
    <main>
      <section className="section" style={{ paddingBottom: 24 }}>
        <div className="container">
          <p className="eyebrow-line" style={{ marginTop: 16 }}>
            Souvenirs du club
          </p>
          <h1 style={{ fontSize: "1.9rem" }}>Galerie</h1>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {albums.length === 0 ? (
            <p style={{ color: "#6b6656" }}>Aucun album pour le moment.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {albums.map((album) => (
                <div key={album.id} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <h3 style={{ fontSize: "1.1rem", margin: 0 }}>{album.titre}</h3>
                      {album.description && (
                        <p style={{ color: "#6b6656", margin: "4px 0 0" }}>{album.description}</p>
                      )}
                      <p style={{ color: "#6b6656", margin: "4px 0 0", fontSize: "0.9rem" }}>
                        {album.photos.length} photo{album.photos.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() =>
                          setAlbumOuvert(albumOuvert === album.id ? null : album.id)
                        }
                      >
                        {albumOuvert === album.id ? "Fermer" : "Voir les photos"}
                      </button>
                    </div>
                  </div>

                  {albumOuvert === album.id && (
                    <div style={{ marginTop: 20, borderTop: "1px solid var(--line)", paddingTop: 20 }}>
                      {album.photos.length === 0 ? (
                        <p style={{ color: "#6b6656" }}>Aucune photo dans cet album.</p>
                      ) : (
                        <div className="grid-4" style={{ marginTop: 16 }}>
                          {album.photos.map((photo) => (
                            <div key={photo.id}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={photo.url}
                                alt={photo.legende ?? album.titre}
                                style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }}
                              />
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