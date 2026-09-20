"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabaseClient";

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
  const supabase = createClient();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [membre, setMembre] = useState<{ prenom: string; photo_url: string | null } | null>(
    null
  );

  useEffect(() => {
    verifierConnexion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verifierConnexion() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const { data: m } = await supabase
      .from("membres")
      .select("prenom, photo_url")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (m) setMembre(m);
  }

  function AvatarMembre() {
    return (
      <Link
        href="/membre/profil"
        onClick={() => setMenuOuvert(false)}
        title="Mon profil"
        style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}
      >
        {membre?.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={membre.photo_url}
            alt={membre.prenom}
            style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--emerald)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "0.9rem",
            }}
          >
            {membre?.prenom?.[0]}
          </div>
        )}
      </Link>
    );
  }

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
          {membre ? (
            <AvatarMembre />
          ) : (
            <Link href="/membre" className="btn btn-outline" style={{ padding: "10px 18px" }}>
              Se connecter
            </Link>
          )}
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
          {membre ? (
            <div style={{ marginTop: 12 }}>
              <AvatarMembre />
            </div>
          ) : (
            <Link
              href="/membre"
              onClick={() => setMenuOuvert(false)}
              className="btn btn-outline"
              style={{ marginTop: 8, textAlign: "center" }}
            >
              Se connecter
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}