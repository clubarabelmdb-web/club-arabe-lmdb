"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabaseClient";

type Membre = {
  numero_membre: string;
  prenom: string;
  nom: string;
  classe: string;
  annee_scolaire: string;
  statut: string;
  photo_url: string | null;
};

export default function VerificationCarte() {
  const router = useRouter();
  const supabase = createClient();

  const [pret, setPret] = useState(false);
  const [numero, setNumero] = useState("");
  const [resultat, setResultat] = useState<Membre | null | "introuvable">(null);
  const [recherche, setRecherche] = useState(false);

  useEffect(() => {
    verifierAcces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verifierAcces() {
    const { data: session } = await supabase.auth.getUser();
    if (!session.user) {
      router.push("/admin");
      return;
    }
    const { data: admin } = await supabase
      .from("administrateurs")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (!admin) {
      router.push("/admin");
      return;
    }
    setPret(true);
  }

  async function verifierCarte(e: React.FormEvent) {
    e.preventDefault();
    setRecherche(true);
    setResultat(null);

    const { data } = await supabase
      .from("membres")
      .select("numero_membre, prenom, nom, classe, annee_scolaire, statut, photo_url")
      .eq("numero_membre", numero.trim().toUpperCase())
      .maybeSingle();

    setResultat((data as Membre) ?? "introuvable");
    setRecherche(false);
  }

  if (!pret) {
    return (
      <main className="container section">
        <p>Vérification des accès...</p>
      </main>
    );
  }

  return (
    <main>
      <section className="section" style={{ paddingBottom: 24 }}>
        <div className="container" style={{ maxWidth: 560 }}>
          <Link href="/admin/dashboard" style={{ color: "var(--emerald)", fontSize: "0.95rem" }}>
            ← Retour au tableau de bord
          </Link>
          <p className="eyebrow-line" style={{ marginTop: 16 }}>
            Espace administrateur
          </p>
          <h1 style={{ fontSize: "1.9rem" }}>Vérifier une carte de membre</h1>
          <p style={{ color: "#6b6656" }}>
            Tape le numéro inscrit sur la carte (ex : CA-LMDB-0001) pour vérifier
            qu'elle est authentique et voir le statut du membre.
          </p>

          <form onSubmit={verifierCarte} style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <input
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="CA-LMDB-0001"
              style={{
                flex: 1,
                padding: "11px 14px",
                border: "1.5px solid var(--line)",
                borderRadius: 3,
                fontFamily: "monospace",
                fontSize: "1rem",
              }}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={recherche}>
              {recherche ? "Recherche..." : "Vérifier"}
            </button>
          </form>

          {resultat === "introuvable" && (
            <div className="card" style={{ marginTop: 24, borderColor: "#8a2d2d" }}>
              <p style={{ color: "#8a2d2d", fontWeight: 600, margin: 0 }}>
                ❌ Carte introuvable
              </p>
              <p style={{ color: "#6b6656", margin: "4px 0 0" }}>
                Aucun membre ne correspond à ce numéro. Vérifie l'orthographe ou
                la mise en forme (ex : CA-LMDB-0001).
              </p>
            </div>
          )}

          {resultat && resultat !== "introuvable" && (
            <div
              className="card"
              style={{
                marginTop: 24,
                background: "var(--emerald-deep)",
                color: "var(--parchment)",
                borderColor: "var(--emerald-deep)",
              }}
            >
              <p
                style={{
                  color: resultat.statut === "actif" ? "#8fd6b0" : "#e8a3a3",
                  fontWeight: 700,
                  margin: "0 0 12px",
                }}
              >
                {resultat.statut === "actif" ? "✅ CARTE VALIDE — MEMBRE ACTIF" : "⚠️ MEMBRE INACTIF"}
              </p>

              <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                <div style={{ background: "#fff", padding: 8, display: "inline-block" }}>
                  <QRCodeSVG value={resultat.numero_membre} size={80} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>
                    {resultat.prenom} {resultat.nom}
                  </p>"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabaseClient";

type Membre = {
  numero_membre: string;
  prenom: string;
  nom: string;
  classe: string;
  annee_scolaire: string;
  statut: string;
  photo_url: string | null;
};

export default function VerificationCarte() {
  const router = useRouter();
  const supabase = createClient();

  const [pret, setPret] = useState(false);
  const [numero, setNumero] = useState("");
  const [resultat, setResultat] = useState<Membre | null | "introuvable">(null);
  const [recherche, setRecherche] = useState(false);

  useEffect(() => {
    verifierAcces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verifierAcces() {
    const { data: session } = await supabase.auth.getUser();
    if (!session.user) {
      router.push("/admin");
      return;
    }
    const { data: admin } = await supabase
      .from("administrateurs")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (!admin) {
      router.push("/admin");
      return;
    }
    setPret(true);
  }

  async function verifierCarte(e: React.FormEvent) {
    e.preventDefault();
    setRecherche(true);
    setResultat(null);

    const { data } = await supabase
      .from("membres")
      .select("numero_membre, prenom, nom, classe, annee_scolaire, statut, photo_url")
      .eq("numero_membre", numero.trim().toUpperCase())
      .maybeSingle();

    setResultat((data as Membre) ?? "introuvable");
    setRecherche(false);
  }

  if (!pret) {
    return (
      <main className="container section">
        <p>Vérification des accès...</p>
      </main>
    );
  }

  return (
    <main>
      <section className="section" style={{ paddingBottom: 24 }}>
        <div className="container" style={{ maxWidth: 560 }}>
          <Link href="/admin/dashboard" style={{ color: "var(--emerald)", fontSize: "0.95rem" }}>
            ← Retour au tableau de bord
          </Link>
          <p className="eyebrow-line" style={{ marginTop: 16 }}>
            Espace administrateur
          </p>
          <h1 style={{ fontSize: "1.9rem" }}>Vérifier une carte de membre</h1>
          <p style={{ color: "#6b6656" }}>
            Tape le numéro inscrit sur la carte (ex : CA-LMDB-0001) pour vérifier
            qu'elle est authentique et voir le statut du membre.
          </p>

          <form onSubmit={verifierCarte} style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <input
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="CA-LMDB-0001"
              style={{
                flex: 1,
                padding: "11px 14px",
                border: "1.5px solid var(--line)",
                borderRadius: 3,
                fontFamily: "monospace",
                fontSize: "1rem",
              }}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={recherche}>
              {recherche ? "Recherche..." : "Vérifier"}
            </button>
          </form>

          {resultat === "introuvable" && (
            <div className="card" style={{ marginTop: 24, borderColor: "#8a2d2d" }}>
              <p style={{ color: "#8a2d2d", fontWeight: 600, margin: 0 }}>
                ❌ Carte introuvable
              </p>
              <p style={{ color: "#6b6656", margin: "4px 0 0" }}>
                Aucun membre ne correspond à ce numéro. Vérifie l'orthographe ou
                la mise en forme (ex : CA-LMDB-0001).
              </p>
            </div>
          )}

          {resultat && resultat !== "introuvable" && (
            <div
              className="card"
              style={{
                marginTop: 24,
                background: "var(--emerald-deep)",
                color: "var(--parchment)",
                borderColor: "var(--emerald-deep)",
              }}
            >
              <p
                style={{
                  color: resultat.statut === "actif" ? "#8fd6b0" : "#e8a3a3",
                  fontWeight: 700,
                  margin: "0 0 12px",
                }}
              >
                {resultat.statut === "actif" ? "✅ CARTE VALIDE — MEMBRE ACTIF" : "⚠️ MEMBRE INACTIF"}
              </p>

              <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                {resultat.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resultat.photo_url}
                    alt={`${resultat.prenom} ${resultat.nom}`}
                    style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                  />
                ) : null}
                <div style={{ background: "#fff", padding: 8, display: "inline-block" }}>
                  <QRCodeSVG value={resultat.numero_membre} size={80} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>
                    {resultat.prenom} {resultat.nom}
                  </p>
                  <p style={{ margin: 0, color: "var(--gold-soft)" }}>{resultat.classe}</p>
                  <p style={{ margin: "8px 0 0", fontFamily: "monospace" }}>{resultat.numero_membre}</p>
                  <p style={{ margin: "8px 0 0", fontSize: "0.85rem", color: "var(--gold-soft)" }}>
                    Année {resultat.annee_scolaire}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
                  <p style={{ margin: 0, color: "var(--gold-soft)" }}>{resultat.classe}</p>
                  <p style={{ margin: "8px 0 0", fontFamily: "monospace" }}>{resultat.numero_membre}</p>
                  <p style={{ margin: "8px 0 0", fontSize: "0.85rem", color: "var(--gold-soft)" }}>
                    Année {resultat.annee_scolaire}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}