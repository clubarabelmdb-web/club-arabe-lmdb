import Link from "next/link";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/a-propos", label: "À propos" },
  { href: "/actualites", label: "Actualités" },
  { href: "/activites", label: "Activités" },
  { href: "/galerie", label: "Galerie" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  return (
    <header
      style={{
        borderBottom: "1px solid var(--line)",
        background: "var(--parchment)",
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 76,
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "var(--emerald-deep)",
            textDecoration: "none",
          }}
        >
          Club Arabe <span style={{ color: "var(--gold)" }}>· LMDB</span>
        </Link>

        <nav style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                textDecoration: "none",
                color: "var(--ink)",
                fontSize: "0.98rem",
              }}
            >
              {l.label}
            </Link>
          ))}
          <Link href="/inscription" className="btn btn-primary" style={{ padding: "10px 20px" }}>
            S'inscrire
          </Link>
          <Link href="/membre" className="btn btn-outline" style={{ padding: "10px 18px" }}>
            Se connecter
          </Link>
        </nav>
      </div>
    </header>
  );
}