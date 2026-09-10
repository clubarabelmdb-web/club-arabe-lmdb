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

export default async function Accueil() {
  const actualites = await getDerniereActualite();

  return (
    <main>
      {/* HERO */}
      <section
        style={{
          background: "var(--emerald-deep)",
          color: "var(--parchment)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <GeometricPattern
                    color="#c9a227"
          opacity={0.18}
          className="hero-pattern"
        />
        <div
          className="container hero-grid"
          style={{
            position: "relative",
            padding: "96px 24px 88px",
          }}
        >
          <div>
            <p className="eyebrow-line" style={{ color: "var(--gold-soft)" }}>
              Lycée Maba Diakhou Ba
            </p>
            <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 3.4rem)", maxWidth: "16ch" }}>
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
                style={{ border: "1.5px solid var(--parchment)", color: "var(--parchment)" }}
              >
                Découvrir le club
              </Link>
            </div>
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
          <div
            className="grid-3"
            style={{ marginTop: 36 }}
          >
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
