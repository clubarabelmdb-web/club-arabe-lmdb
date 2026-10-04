"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import type { Html5QrcodeScanner as Html5QrcodeScannerInstance } from "html5-qrcode";
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
  const [scannerActif, setScannerActif] = useState(false);
  const [erreurScanner, setErreurScanner] = useState<string | null>(null);
  const [erreurRecherche, setErreurRecherche] = useState<string | null>(null);
  const scanTraite = useRef(false);

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

  useEffect(() => {
    if (!scannerActif) return;

    let annule = false;
    let scanner: Html5QrcodeScannerInstance | null = null;

    async function demarrerScanner() {
      try {
        const { Html5QrcodeScanner } = await import("html5-qrcode");
        if (annule) return;

        scanner = new Html5QrcodeScanner(
          "lecteur-carte",
          { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
          false
        );
        scanner.render((texteDecode) => {
          if (scanTraite.current) return;
          scanTraite.current = true;
          setNumero(texteDecode.trim());
          setScannerActif(false);
          void verifierCarteParNumero(texteDecode);
        }, () => {});
      } catch (error) {
        console.error("Impossible de démarrer le scanner QR :", error);
        if (!annule) {
          setErreurScanner("Impossible d'ouvrir la caméra. Vérifie les permissions du navigateur.");
          setScannerActif(false);
        }
      }
    }

    void demarrerScanner();

    return () => {
      annule = true;
      if (scanner) {
        void scanner.clear().catch((error: unknown) => {
          console.error("Impossible d'arrêter proprement le scanner QR :", error);
        });
      }
    };
    // The callback performs a lookup after the first successful scan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerActif]);

  async function verifierCarteParNumero(valeur: string) {
    const numeroNormalise = valeur.trim().toUpperCase();
    if (!numeroNormalise) return;

    setRecherche(true);
    setResultat(null);
    setErreurRecherche(null);

    try {
      const { data, error } = await supabase
        .from("membres")
        .select("numero_membre, prenom, nom, classe, annee_scolaire, statut, photo_url")
        .eq("numero_membre", numeroNormalise)
        .maybeSingle();

      if (error) throw error;
      setResultat((data as Membre | null) ?? "introuvable");
    } catch {
      setErreurRecherche("La vérification a échoué. Vérifie ta connexion et réessaie.");
    } finally {
      setRecherche(false);
    }
  }

  function verifierCarte(e: React.FormEvent) {
    e.preventDefault();
    void verifierCarteParNumero(numero);
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
            Scanne le QR code de la carte ou saisis son numéro pour vérifier le statut du membre.
          </p>

          <button
            type="button"
            className={scannerActif ? "btn btn-outline" : "btn btn-primary"}
            onClick={() => {
              setErreurScanner(null);
              scanTraite.current = false;
              setScannerActif((actif) => !actif);
            }}
            style={{ marginBottom: 16 }}
          >
            {scannerActif ? "Arrêter le scanner" : "Ouvrir le scanner"}
          </button>

          {scannerActif && (
            <div
              id="lecteur-carte"
              style={{ maxWidth: 440, marginBottom: 24 }}
              aria-label="Lecteur de QR code"
            />
          )}

          {erreurScanner && (
            <p role="alert" style={{ color: "#8a2d2d" }}>
              {erreurScanner}
            </p>
          )}

          <p style={{ color: "#6b6656", marginBottom: 8 }}>Ou vérifie avec le numéro de membre :</p>
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

          {erreurRecherche && (
            <p role="alert" style={{ color: "#8a2d2d", marginTop: 16 }}>
              {erreurRecherche}
            </p>
          )}

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
                background: resultat.statut === "actif" ? "var(--emerald-deep)" : "#6b1f1f",
                color: "var(--parchment)",
                borderColor: resultat.statut === "actif" ? "var(--emerald-deep)" : "#6b1f1f",
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