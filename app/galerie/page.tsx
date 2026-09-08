import { createClient } from "@/lib/supabaseClient";

export const metadata = { title: "Galerie — Club Arabe LMDB" };
export const revalidate = 60;

async function getAlbums() {
  try {
    const supabase = createClient();
    const { data: albums } = await supabase
      .from("albums")
      .select("*")
      .order("cree_le", { ascending: false });

    if (!albums) return [];

    const albumsAvecPhotos = await Promise.all(
      albums.map(async (album) => {
        const { data: photos } = await supabase
          .from("photos")
          .select("*")
          .eq("album_id", album.id)
          .limit(4);
        return { ...album, photos: photos ?? [] };
      })
    );

    return albumsAvecPhotos;
  } catch {
    return [];
  }
}

export default async function Galerie() {
  const albums = await getAlbums();

  return (
    <main>
      <section className="section">
        <div className="container">
          <p className="eyebrow-line">Galerie</p>
          <h1 style={{ fontSize: "2rem" }}>Les souvenirs du club</h1>

          {albums.length === 0 ? (
            <p style={{ color: "#6b6656", marginTop: 24 }}>
              Aucun album n'a encore été publié. Les photos des activités du
              club apparaîtront ici.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 40, marginTop: 32 }}>
              {albums.map((album: any) => (
                <div key={album.id}>
                  <h2 style={{ fontSize: "1.3rem" }}>{album.titre}</h2>
                  {album.description && (
                    <p style={{ color: "#6b6656" }}>{album.description}</p>
                  )}
                  <div className="grid-4">
                    {album.photos.map((p: any) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={p.id}
                        src={p.url}
                        alt={p.legende ?? album.titre}
                        style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
