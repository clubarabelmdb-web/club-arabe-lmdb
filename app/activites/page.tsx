import { createClient } from "@/lib/supabaseClient";

export const metadata = { title: "Activités — Club Arabe LMDB" };
export const revalidate = 60;

async function getActivites() {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("activites")
      .select("*")
      .order("date_activite", { ascending: true });
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function Activites() {
  const activites = await getActivites();
  const aujourdhui = new Date().toISOString().slice(0, 10);

  const aVenir = activites.filter((a: any) => a.date_activite >= aujourdhui);
  const passees = activites.filter((a: any) => a.date_activite < aujourdhui).reverse();

  function CarteActivite({ a }: { a: any }) {
    return (
      <div className="card">
        {a.affiche_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={a.affiche_url}
            alt={a.titre}
            style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", marginBottom: 16 }}
          />
        )}
        <p style={{ fontSize: "0.85rem", color: "var(--gold)", marginBottom: 4 }}>
          {new Date(a.date_activite).toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          {a.heure ? ` · ${a.heure}` : ""}
        </p>
        <h2 style={{ fontSize: "1.25rem" }}>{a.titre}</h2>
        {a.lieu && <p style={{ color: "#6b6656", margin: "0 0 8px" }}>📍 {a.lieu}</p>}
        {a.description && <p style={{ color: "#4a463d" }}>{a.description}</p>}
        {a.programme && (
          <p style={{ color: "#4a463d", marginTop: 8 }}>
            <strong>Programme :</strong> {a.programme}
          </p>
        )}
      </div>
    );
  }

  return (
    <main>
      <section className="section">
        <div className="container">
          <p className="eyebrow-line">Activités</p>
          <h1 style={{ fontSize: "2rem" }}>Activités et événements du club</h1>

          <h2 style={{ fontSize: "1.3rem", marginTop: 32 }}>À venir</h2>
          {aVenir.length === 0 ? (
            <p style={{ color: "#6b6656" }}>Aucun événement à venir pour le moment.</p>
          ) : (
            <div className="grid-3" style={{ marginTop: 16 }}>
              {aVenir.map((a: any) => (
                <CarteActivite key={a.id} a={a} />
              ))}
            </div>
          )}

          {passees.length > 0 && (
            <>
              <h2 style={{ fontSize: "1.3rem", marginTop: 48 }}>Archives</h2>
              <div className="grid-3" style={{ marginTop: 16 }}>
                {passees.map((a: any) => (
                  <CarteActivite key={a.id} a={a} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}