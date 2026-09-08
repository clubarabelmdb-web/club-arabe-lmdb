import { createClient } from "@/lib/supabaseClient";

export const metadata = { title: "Actualités — Club Arabe LMDB" };
export const revalidate = 60;

async function getActualites() {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("actualites")
      .select("*")
      .order("publie_le", { ascending: false });
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function Actualites() {
  const actualites = await getActualites();

  return (
    <main>
      <section className="section">
        <div className="container">
          <p className="eyebrow-line">Actualités</p>
          <h1 style={{ fontSize: "2rem" }}>Les nouvelles du Club Arabe</h1>

          {actualites.length === 0 ? (
            <p style={{ color: "#6b6656", marginTop: 24 }}>
              Aucune actualité publiée pour le moment.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 32 }}>
              {actualites.map((a: any) => (
                <article key={a.id} className="card">
                  <p style={{ fontSize: "0.85rem", color: "var(--gold)", marginBottom: 4 }}>
                    {new Date(a.publie_le).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    {a.auteur ? ` · ${a.auteur}` : ""}
                  </p>
                  <h2 style={{ fontSize: "1.25rem" }}>{a.titre}</h2>
                  <p style={{ color: "#4a463d" }}>{a.description}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
