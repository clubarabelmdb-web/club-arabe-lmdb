import Link from "next/link";
import Image from "next/image";

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
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: "var(--font-display)",
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "var(--emerald-deep)",
            textDecoration: "none",
          }}
        >
          <Image
            src="/images/logo.png"
            alt="Logo du Club Arabe"
            width={44}
            height={44}
            style={{ borderRadius: "50%" }}
            priority
          />
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
        </nav>
      </div>
    </header>
  );
}