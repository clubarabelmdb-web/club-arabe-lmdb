export default function Footer() {
  return (
    <footer
      style={{
        background: "var(--emerald-deep)",
        color: "var(--parchment)",
        marginTop: 80,
      }}
    >
      <div className="container" style={{ padding: "48px 24px 32px", display: "grid", gap: 32, gridTemplateColumns: "1.3fr 1fr 1fr" }}>
        <div>
          <h3 style={{ color: "var(--parchment)", fontSize: "1.15rem" }}>Club Arabe · LMDB</h3>
          <p style={{ color: "var(--gold-soft)", maxWidth: "40ch" }}>
            Un espace dédié à la langue arabe, à la culture, à l'apprentissage et
            au partage — Lycée Maba Diakhou Ba.
          </p>
        </div>
        <div>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Liens</p>
          <p><a href="/a-propos">À propos</a></p>
          <p><a href="/actualites">Actualités</a></p>
          <p><a href="/inscription">Rejoindre le club</a></p>
        </div>
        <div>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Contact</p>
          <p><a href="/contact">Formulaire de contact</a></p>
        </div>
      </div>
      <div className="divider" style={{ opacity: 0.25 }} />
      <p style={{ textAlign: "center", padding: "16px 0", fontSize: "0.85rem", color: "var(--gold-soft)" }}>
        © {new Date().getFullYear()} Club Arabe — Lycée Maba Diakhou Ba
      </p>
    </footer>
  );
}
