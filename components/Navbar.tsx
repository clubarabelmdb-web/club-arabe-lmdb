"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/a-propos", label: "À propos" },
  { href: "/actualites", label: "Actualités" },
  { href: "/activites", label: "Activités" },
  { href: "/galerie", label: "Galerie" },
  { href: "/cotisation", label: "Cotisation" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [menuOuvert, setMenuOuvert] = useState(false);

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
          onClick={() => setMenuOuvert(false)}
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

        {/* Menu desktop */}
        <nav className="navbar-desktop-links" style={{ display: "flex", gap: 28, alignItems: "center" }}>
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

        {/* Bouton hamburger (mobile uniquement) */}
        <button
          className="navbar-toggle"
          onClick={() => setMenuOuvert(!menuOuvert)}
          aria-label="Ouvrir le menu"
          style={{
            background: "none",
            border: "none",
            fontSize: "1.6rem",
            cursor: "pointer",
            color: "var(--emerald-deep)",
            padding: 4,
          }}
        >
          {menuOuvert ? "✕" : "☰"}
        </button>
      </div>

      {/* Menu mobile déroulant */}
      {menuOuvert && (
        <nav
          className="navbar-mobile-menu"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            padding: "12px 24px 24px",
            borderTop: "1px solid var(--line)",
            background: "var(--parchment)",
          }}
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOuvert(false)}
              style={{
                textDecoration: "none",
                color: "var(--ink)",
                fontSize: "1.05rem",
                padding: "12px 0",
                borderBottom: "1px solid var(--line)",
              }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/inscription"
            onClick={() => setMenuOuvert(false)}
            className="btn btn-primary"
            style={{ marginTop: 16, textAlign: "center" }}
          >
            S'inscrire
          </Link>
        </nav>
      )}
    </header>
  );
}