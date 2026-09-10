import { createClient } from "@/lib/supabaseClient";

export const metadata = { title: "À propos — Club Arabe LMDB" };
export const revalidate = 60;

const activites = [
  "Apprentissage de l'arabe",
  "Conférences",
  "Concours",
  "Débats",
  "Récitations",
  "Activités culturelles",
  "Journées arabes",
  "Activités éducatives",
];

async function getBureau() {
  try {
    const supabase = createClient();
    const { data } = await supabase.from("bureau").select("*").order("ordre", { ascending: true });
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function APropos() {
  const bureau = await getBureau();

  return (
    <main>
      <section className="section" style={{ paddingBottom: 24 }}>
        <div className="container">
          <p className="eyebrow-line">À propos</p>
          <h1 style={{ fontSize: "2.2rem", maxWidth: "24ch" }}>
            Le Club Arabe du Lycée Maba Diakhou Ba
          </h1>
          <p style={{ fontSize: "1.05rem", color: "#4a463d" }}>
            Notre mission est de faire vivre la langue et la culture arabes au
            sein du lycée, à travers l'apprentissage, le partage et des
            activités éducatives ouvertes à tous les élèves.
          </p>
        </div>
      </section>

      <hr className="divider" />

      <section className="section">
        <div className="container grid-2">
          <div>
            <h2 style={{ fontSize: "1.4rem" }}>Notre vision</h2>
            <p style={{ color: "#4a463d" }}>
              Faire du Club Arabe un espace vivant où chaque élève peut
              découvrir la richesse de la langue et de la culture arabes, dans
              un cadre convivial et éducatif.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: "1.4rem" }}>Nos objectifs</h2>
            <p style={{ color: "#4a463d" }}>
              Encourager l'apprentissage de l'arabe, organiser des activités
              culturelles régulières, et créer des liens entre les élèves
              autour d'un intérêt commun.
            </p>
          </div>
        </div>
      </section>

      <hr className="divider" />

      <section className="section">
        <div className="container">
          <p className="eyebrow-line">Nos activités</p>
          <h2 style={{ fontSize: "1.6rem" }}>Ce que nous organisons</h2>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 20,
            }}
          >
            {activites.map((a) => (
              <span
                key={a}
                style={{
                  border: "1.5px solid var(--emerald)",
                  color: "var(--emerald-deep)",
                  padding: "8px 16px",
                  borderRadius: 3,
                  fontSize: "0.95rem",
                }}
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      </section>

      <hr className="divider" />

      <section className="section">
        <div className="container">
          <p className="eyebrow-line">Organisation</p>
          <h2 style={{ fontSize: "1.6rem" }}>Le bureau du club</h2>
          <div className="grid-4" style={{ marginTop: 24 }}>
            {bureau.map((b: any) => (
              <div key={b.id} className="card" style={{ textAlign: "center" }}>
                <p style={{ fontWeight: 600, color: "var(--emerald-deep)" }}>{b.poste}</p>
                <p style={{ color: "#6b6656" }}>{b.nom}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}