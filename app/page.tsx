import Link from "next/link";
import GeometricPattern from "@/components/GeometricPattern";
import { createClient } from "@/lib/supabaseClient";

export const revalidate = 60;

async function getDerniereActualite() {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("actualites")
      .select("titre, description, publie_le")
      .order("publie_le", { ascending: false })
      .limit(3);
    return data ?? [];
  } catch {
    return [];
  }
}

async function getStatistiques() {
  try {
    const supabase = createClient();
    const { count: nbMembres } = await supabase
      .from("membres")
      .select("id", { count: "exact", head: true });
    const { count: nbActivites } = await supabase
      .from("activites")
      .select("id", { count: "exact", head: true });
    const { count: nbActualites } = await supabase
      .from("actualites")
      .select("id", { count: "exact", head: true });
    return {
      membres: nbMembres ?? 0,
      activites: nbActivites ?? 0,
      actualites: nbActualites ?? 0,
    };
  } catch {
    return { membres: 0, activites: 0, actualites: 0 };
  }
}

export default async function Accueil() {
  const actualites = await getDerniereActualite();
  const stats = await getStatistiques();

  return (
    <main>
      {/* HERO */}
      <section
        style={{
          background:
            "radial-gradient(circle at 15% 20%, rgba(212,175,106,0.16), transparent 40%), linear-gradient(135deg, #064e3b 0%, #087f5b 65%, #0b6b52 100%)",
          color: "var(--parchment)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <GeometricPattern
          color="#d4af6a"
          opacity={0.14}
          className="hero-pattern"
        />
        <div
          className="container hero-grid"
          style={{
            position: "relative",
            padding: "104px 24px 96px",
          }}
        >
          <div>
            <p className="eyebrow-line" style={{ color: "var(--gold-soft)" }}>
              Lycée Maba Diakhou Ba
            </p>
            <h1
              style={{
                fontSize: "clamp(2.3rem, 5vw, 3.6rem)",
                maxWidth: "16ch",
                color: "var(--parchment)",
                textShadow: "0 2px 24px rgba(0,0,0,0.25)",
              }}
            >
              Le Club Arabe : langue, culture et savoir partagés
            </h1>
            <p style={{ color: "var(--gold-soft)", fontSize: "1.1rem", maxWidth: "48ch" }}>
              Un espace dédié à la langue arabe, à la culture, à l'apprentissage,
              au partage et aux activités éducatives et culturelles.
            </p>
            <div style={{ display: "flex", gap: 16, marginTop: 24, flexWrap: "wrap" }}>
              <Link href="/inscription" className="btn btn-gold">
                S'inscrire au club
              </Link>
              <Link
                href="/a-propos"
                className="btn"
                style={{
                  border: "1.5px solid rgba(252,250,244,0.5)",
                  color: "var(--parchment)",
                  background: "rgba(255,255,255,0.06)",
                }}
              >
                Découvrir le club
              </Link>
            </div>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(212,175,106,0.35)",
              borderRadius: "var(--radius-lg, 18px)",
              backdropFilter: "blur(6px)",
              padding: 28,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 20,
            }}
          >
            {[
              { chiffre: stats.membres, label: "Membres" },
              { chiffre: stats.activites, label: "Activités" },
              { chiffre: stats.actualites, label: "Actualités" },
              { chiffre: "2026", label: "Année scolaire" },
            ].map((s) => (
              <div key={s.label}>
                <p
                  style={{
                    fontSize: "2.1rem",
                    fontWeight: 700,
                    color: "var(--gold-soft)",
                    margin: 0,
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {s.chiffre}
                </p>
                <p style={{ color: "var(--parchment)", margin: 0, fontSize: "0.9rem" }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OBJECTIFS */}
      <section className="section">
        <div className="container">
          <p className="eyebrow-line">Ce que propose le club</p>
          <h2 style={{ fontSize: "1.9rem", maxWidth: "30ch" }}>
            Apprendre, débattre et célébrer la culture arabe ensemble
          </h2>
          <div className="grid-3" style={{ marginTop: 36 }}>
            {[
              {
                titre: "Apprentissage de l'arabe",
                texte: "Cours, ateliers de langue et de calligraphie ouverts à tous les niveaux.",
              },
              {
                titre: "Conférences & débats",
                texte: "Rencontres, concours de récitation et discussions sur la culture arabe.",
              },
              {
                titre: "Journées culturelles",
                texte: "Événements et activités éducatives tout au long de l'année scolaire.",
              },
            ].map((item) => (
              <div key={item.titre} className="card">
                <h3 style={{ fontSize: "1.15rem", color: "var(--emerald-deep)" }}>{item.titre}</h3>
                <p style={{ color: "#4a463d" }}>{item.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* ACTUALITÉS RÉCENTES */}
      <section className="section">
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div>
              <p className="eyebrow-line">Dernières nouvelles</p>
              <h2 style={{ fontSize: "1.9rem" }}>Actualités du club</h2>
            </div>
            <Link href="/actualites" style={{ color: "var(--emerald)", fontWeight: 600, textDecoration: "none" }}>
              Voir tout
            </Link>
          </div>

          {actualites.length === 0 ? (
            <p style={{ color: "#6b6656", marginTop: 24 }}>
              Aucune actualité publiée pour le moment. Revenez bientôt !
            </p>
          ) : (
            <div className="grid-3" style={{ marginTop: 32 }}>
              {actualites.map((a: any, i: number) => (
                <div key={i} className="card">
                  <h3 style={{ fontSize: "1.1rem" }}>{a.titre}</h3>
                  <p style={{ color: "#4a463d" }}>{a.description?.slice(0, 110)}…</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA FINAL */}
      <section
        className="section"
        style={{ background: "var(--emerald-soft)", textAlign: "center" }}
      >
        <div className="container">
          <h2 style={{ fontSize: "1.8rem" }}>Envie de rejoindre le Club Arabe ?</h2>
          <p style={{ margin: "0 auto 24px", color: "#3d4d47" }}>
            L'inscription ne prend que quelques minutes. Ta demande sera examinée
            par l'administration du club avant validation.
          </p>
          <Link href="/inscription" className="btn btn-primary">
            Remplir le formulaire d'inscription
          </Link>
        </div>
      </section>
    </main>
  );
}