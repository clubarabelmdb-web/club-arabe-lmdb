"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabaseClient";
import { demanderPermissionEtObtenirJeton } from "@/lib/firebaseClient";

type Membre = {
  id: string;
  numero_membre: string;
  prenom: string;
  nom: string;
  classe: string;
  annee_scolaire: string;
  statut: string;
  photo_url: string | null;
};

type Notification = {
  id: string;
  titre: string;
  message: string;
  cree_le: string;
};

type Paiement = {
  id: string;
  type_paiement: string;
  montant: number;
  methode: string;
  annee_scolaire: string;
  paye_le: string;
};

const typePaiementLabel: Record<string, string> = {
  cotisation: "Cotisation",
  don: "Don",
  autre: "Autre paiement",
};

const methodePaiementLabel: Record<string, string> = {
  especes: "Espèces",
  orange_money: "Orange Money",
  wave: "Wave",
  autre: "Autre",
};

const formaterMontant = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

function echapperHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return replacements[character];
  });
}

export default function EspaceMembre() {
  const supabase = createClient();
  const carteQrRef = useRef<HTMLDivElement>(null);
  const [connecte, setConnecte] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [membre, setMembre] = useState<Membre | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [chargementPaiements, setChargementPaiements] = useState(false);
  const [erreurPaiements, setErreurPaiements] = useState("");
  const [statutCarte, setStatutCarte] = useState("");
  const [erreur, setErreur] = useState("");
  const [notifStatut, setNotifStatut] = useState<"inactif" | "en_cours" | "actif" | "erreur">(
    "inactif"
  );

  useEffect(() => {
    verifier();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verifier() {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const { data: session } = await supabase.auth.getSession();
      if (session.session?.access_token) {
        await chargerProfil(data.user.id, session.session.access_token);
      }
      setConnecte(true);
    }
    setChargement(false);
  }

  async function chargerProfil(userId: string, accessToken: string) {
    const { data: m } = await supabase
      .from("membres")
      .select("id, numero_membre, prenom, nom, classe, annee_scolaire, statut, photo_url")
      .eq("user_id", userId)
      .maybeSingle();
    if (m) {
      setMembre(m as Membre);
      const { data: notifs } = await supabase
        .from("notifications")
        .select("id, titre, message, cree_le")
        .eq("membre_id", (m as Membre).id)
        .order("cree_le", { ascending: false });
      setNotifications((notifs as Notification[]) ?? []);
    }
    await chargerPaiements(accessToken);
  }

  async function chargerPaiements(accessToken: string) {
    setChargementPaiements(true);
    setErreurPaiements("");
    try {
      const response = await fetch("/api/membre/paiements", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const result: unknown = await response.json();
      if (!result || typeof result !== "object") {
        throw new Error("Réponse invalide lors du chargement des paiements.");
      }
      const data = result as { paiements?: unknown; error?: unknown };
      if (!response.ok || !Array.isArray(data.paiements)) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Impossible de charger l’historique de tes paiements."
        );
      }
      setPaiements(data.paiements as Paiement[]);
    } catch (paiementError) {
      setErreurPaiements(
        paiementError instanceof Error
          ? paiementError.message
          : "Une erreur inattendue est survenue au chargement des paiements."
      );
    } finally {
      setChargementPaiements(false);
    }
  }

  function genererRecu(paiement: Paiement) {
    if (!membre) return;
    const fenetre = window.open("", "_blank");
    if (!fenetre) {
      setErreurPaiements("Autorise les fenêtres pop-up pour imprimer ou enregistrer ton reçu.");
      return;
    }
    fenetre.opener = null;

    const numeroRecu = paiement.id.slice(0, 8).toUpperCase();
    const datePaiement = new Date(paiement.paye_le);
    const dateAffichee = Number.isNaN(datePaiement.getTime())
      ? "Date non disponible"
      : datePaiement.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
    const nomAffiche = `${membre.prenom} ${membre.nom}`;
    const typeAffiche = typePaiementLabel[paiement.type_paiement] ?? paiement.type_paiement;
    const methodeAffiche = methodePaiementLabel[paiement.methode] ?? paiement.methode;
    const montantAffiche = `${formaterMontant.format(Number(paiement.montant))} FCFA`;

    fenetre.document.open();
    fenetre.document.write(`<!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Reçu ${echapperHtml(numeroRecu)} - Club Arabe LMDB</title>
        <style>
          body { font-family: Georgia, serif; color: #1f2933; max-width: 640px; margin: 40px auto; padding: 0 24px; }
          header { border-bottom: 3px solid #0f5132; padding-bottom: 18px; margin-bottom: 24px; }
          header h1 { color: #0f5132; font-size: 1.3rem; margin: 0; }
          header p { color: #6b6656; margin: 4px 0 0; }
          h2 { color: #0f5132; font-size: 1.6rem; margin-bottom: 4px; }
          .numero { color: #6b6656; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
          td { padding: 10px 0; border-bottom: 1px solid #dce3d7; }
          td:first-child { color: #6b6656; }
          td:last-child { text-align: right; font-weight: 600; }
          .montant { color: #0f5132; font-size: 1.5rem; font-weight: 700; text-align: right; }
          .pied { color: #6b6656; font-size: .85rem; margin-top: 48px; text-align: center; }
          @media print { body { margin: 0 auto; } .actions { display: none; } }
        </style>
      </head>
      <body>
        <header>
          <h1>CLUB ARABE</h1>
          <p>Lycée Maba Diakhou Ba</p>
        </header>
        <h2>Reçu de paiement</h2>
        <p class="numero">N° ${echapperHtml(numeroRecu)} — ${echapperHtml(dateAffichee)}</p>
        <table>
          <tr><td>Reçu de</td><td>${echapperHtml(nomAffiche)}</td></tr>
          <tr><td>Numéro de membre</td><td>${echapperHtml(membre.numero_membre)}</td></tr>
          <tr><td>Type</td><td>${echapperHtml(typeAffiche)}</td></tr>
          <tr><td>Méthode de paiement</td><td>${echapperHtml(methodeAffiche)}</td></tr>
          <tr><td>Année scolaire</td><td>${echapperHtml(paiement.annee_scolaire)}</td></tr>
        </table>
        <p class="montant">${echapperHtml(montantAffiche)}</p>
        <p class="pied">Reçu généré à partir d’un paiement enregistré par le Club Arabe — Lycée Maba Diakhou Ba.</p>
        <p class="actions"><button onclick="window.print()">Imprimer ou enregistrer en PDF</button></p>
      </body>
      </html>`);
    fenetre.document.close();
  }

  async function activerNotifications() {
    if (!membre) return;
    setNotifStatut("en_cours");
    try {
      const jeton = await demanderPermissionEtObtenirJeton();
      if (!jeton) {
        setNotifStatut("erreur");
        return;
      }
      const { error } = await supabase
        .from("membre_fcm_tokens")
        .upsert({ membre_id: membre.id, token: jeton }, { onConflict: "token" });
      if (error) throw error;
      setNotifStatut("actif");
    } catch (err) {
      console.error("Erreur activation notifications :", err);
      setNotifStatut("erreur");
    }
  }

  async function connexion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur("");
    const formData = new FormData(e.currentTarget);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });
    if (error || !data.user || !data.session?.access_token) {
      setErreur("E-mail ou mot de passe incorrect.");
      return;
    }
    await chargerProfil(data.user.id, data.session.access_token);
    setConnecte(true);
  }

  async function deconnexion() {
    await supabase.auth.signOut();
    setConnecte(false);
    setMembre(null);
    setPaiements([]);
  }

  async function telechargerCarte() {
    if (!membre) return;
    setStatutCarte("");
    const qrSvg = carteQrRef.current?.querySelector("svg");
    if (!qrSvg) {
      setStatutCarte("Le QR code n’est pas encore prêt. Réessaie dans un instant.");
      return;
    }

    let qrObjectUrl: string | null = null;
    let imageObjectUrl: string | null = null;
    try {
      const qrMarkup = new XMLSerializer().serializeToString(qrSvg);
      qrObjectUrl = URL.createObjectURL(
        new Blob([qrMarkup], { type: "image/svg+xml;charset=utf-8" })
      );
      const chargerImage = (src: string, crossOrigin = false) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          if (crossOrigin) image.crossOrigin = "anonymous";
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error("Impossible de charger une image de la carte."));
          image.src = src;
        });

      const qrImage = await chargerImage(qrObjectUrl);
      let photoImage: HTMLImageElement | null = null;
      if (membre.photo_url) {
        try {
          photoImage = await chargerImage(membre.photo_url, true);
        } catch {
          photoImage = null;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = 1050;
      canvas.height = 660;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Le navigateur ne permet pas de créer l’image de la carte.");

      context.fillStyle = "#073d2d";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = "#d8b66a";
      context.lineWidth = 8;
      context.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      context.fillStyle = "#e6c779";
      context.font = "bold 34px Georgia, serif";
      context.fillText("CLUB ARABE — LMDB", 64, 92);
      context.fillStyle = "#f6f0dc";
      context.font = "24px Georgia, serif";
      context.fillText("Lycée Maba Diakhou Ba", 64, 132);
      context.strokeStyle = "rgba(230, 199, 121, 0.65)";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(64, 158);
      context.lineTo(986, 158);
      context.stroke();

      const photoX = 82;
      const photoY = 218;
      const photoSize = 176;
      context.save();
      context.beginPath();
      context.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
      context.clip();
      if (photoImage) {
        context.drawImage(photoImage, photoX, photoY, photoSize, photoSize);
      } else {
        context.fillStyle = "#d9e6d6";
        context.fillRect(photoX, photoY, photoSize, photoSize);
        context.fillStyle = "#0b5138";
        context.font = "bold 58px Arial, sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(
          `${membre.prenom[0] ?? ""}${membre.nom[0] ?? ""}`.toUpperCase(),
          photoX + photoSize / 2,
          photoY + photoSize / 2
        );
        context.textAlign = "start";
        context.textBaseline = "alphabetic";
      }
      context.restore();

      const qrSize = 220;
      const qrX = 748;
      const qrY = 244;
      context.fillStyle = "#ffffff";
      context.fillRect(qrX - 14, qrY - 14, qrSize + 28, qrSize + 28);
      context.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

      context.fillStyle = "#f6f0dc";
      context.font = "bold 35px Arial, sans-serif";
      context.fillText(`${membre.prenom} ${membre.nom}`, 300, 270, 410);
      context.fillStyle = "#e6c779";
      context.font = "28px Arial, sans-serif";
      context.fillText(membre.classe, 300, 322, 410);
      context.fillStyle = "#f6f0dc";
      context.font = "24px monospace";
      context.fillText(membre.numero_membre, 300, 390, 410);
      context.fillStyle = "#d9e6d6";
      context.font = "22px Arial, sans-serif";
      context.fillText(`Année scolaire : ${membre.annee_scolaire}`, 300, 446, 410);
      context.fillText(`Statut : ${membre.statut === "actif" ? "Actif" : "Inactif"}`, 300, 486, 410);
      context.fillStyle = "#e6c779";
      context.font = "18px Arial, sans-serif";
      context.textAlign = "center";
      context.fillText("Présente ce QR code pour vérifier ta carte", 850, 506);
      context.textAlign = "start";

      const imageBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      if (!imageBlob) throw new Error("La carte n’a pas pu être convertie en image.");

      imageObjectUrl = URL.createObjectURL(imageBlob);
      const lien = document.createElement("a");
      lien.href = imageObjectUrl;
      lien.download = `carte-${membre.numero_membre}.png`;
      document.body.appendChild(lien);
      lien.click();
      lien.remove();
      setStatutCarte("La carte a été téléchargée en PNG.");
    } catch (downloadError) {
      console.error("Erreur lors du téléchargement de la carte membre :", downloadError);
      setStatutCarte(
        downloadError instanceof Error
          ? downloadError.message
          : "Impossible de télécharger la carte sur cet appareil."
      );
    } finally {
      if (qrObjectUrl) URL.revokeObjectURL(qrObjectUrl);
      if (imageObjectUrl) URL.revokeObjectURL(imageObjectUrl);
    }
  }

  if (chargement) {
    return (
      <main className="container section">
        <p>Chargement...</p>
      </main>
    );
  }

  if (!connecte) {
    return (
      <main>
        <section className="section" style={{ maxWidth: 420, margin: "0 auto" }}>
          <div className="container">
            <p className="eyebrow-line">Espace membre</p>
            <h1 style={{ fontSize: "1.7rem" }}>Connexion</h1>
            <form onSubmit={connexion}>
              <div className="field">
                <label htmlFor="email">E-mail</label>
                <input id="email" name="email" type="email" required />
              </div>
              <div className="field">
                <label htmlFor="password">Mot de passe</label>
                <input id="password" name="password" type="password" required />
              </div>
              {erreur && <p style={{ color: "#8a2d2d", marginBottom: 16 }}>{erreur}</p>}
              <button type="submit" className="btn btn-primary">
                Se connecter
              </button>
            </form>
            <p style={{ marginTop: 16, fontSize: "0.9rem", color: "#6b6656" }}>
              Pas encore de compte ?{" "}
              <Link href="/membre/creer-compte" style={{ color: "var(--emerald)" }}>
                Créer mon compte
              </Link>
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!membre) {
    return (
      <main className="container section">
        <p style={{ color: "#6b6656" }}>Aucune fiche membre associée. Contacte le bureau.</p>
        <button className="btn btn-outline" onClick={deconnexion}>
          Se déconnecter
        </button>
      </main>
    );
  }

  return (
    <main>
      <section className="section">
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ fontSize: "1.9rem" }}>Bonjour {membre.prenom} !</h1>
            <button className="btn btn-outline" onClick={deconnexion}>
              Se déconnecter
            </button>
          </div>

          <div
            className="card"
            style={{
              marginTop: 24,
              maxWidth: 420,
              background: "var(--emerald-deep)",
              color: "var(--parchment)",
              borderColor: "var(--emerald-deep)",
            }}
          >
            <p style={{ color: "var(--gold-soft)", fontWeight: 700, marginBottom: 20 }}>
              CLUB ARABE — LMDB
            </p>
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              {membre.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={membre.photo_url}
                  alt={membre.prenom}
                  style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover" }}
                />
              )}
              <div ref={carteQrRef} style={{ background: "#fff", padding: 8 }}>
                <QRCodeSVG value={membre.numero_membre} size={92} />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700 }}>
                  {membre.prenom} {membre.nom}
                </p>
                <p style={{ margin: 0, color: "var(--gold-soft)" }}>{membre.classe}</p>
                <p style={{ margin: "8px 0 0", fontFamily: "monospace" }}>
                  {membre.numero_membre}
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <button type="button" className="btn btn-outline" onClick={telechargerCarte}>
              Télécharger ma carte (PNG)
            </button>
            {statutCarte && (
              <p
                role="status"
                style={{
                  color: statutCarte.startsWith("La carte") ? "var(--emerald)" : "#8a2d2d",
                  marginTop: 8,
                }}
              >
                {statutCarte}
              </p>
            )}
          </div>

          <div style={{ marginTop: 20 }}>
            <Link href="/membre/assistant" className="btn btn-outline">
              🤖 Poser une question à l’assistant
            </Link>
          </div>

          <div style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: "1.2rem" }}>Mes cotisations et paiements</h2>
            {chargementPaiements ? (
              <p role="status" style={{ color: "#6b6656" }}>
                Chargement de ton historique...
              </p>
            ) : erreurPaiements ? (
              <p role="alert" style={{ color: "#8a2d2d" }}>
                {erreurPaiements}
              </p>
            ) : paiements.length === 0 ? (
              <p style={{ color: "#6b6656" }}>
                Aucun paiement n’est encore enregistré pour ton compte.
              </p>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {paiements.map((paiement) => (
                    <div key={paiement.id} className="card">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 16,
                          flexWrap: "wrap",
                        }}
                      >
                        <strong>{typePaiementLabel[paiement.type_paiement] ?? paiement.type_paiement}</strong>
                        <strong>{formaterMontant.format(Number(paiement.montant))} FCFA</strong>
                      </div>
                      <p style={{ color: "#6b6656", margin: "6px 0 0" }}>
                        Année scolaire : {paiement.annee_scolaire}
                      </p>
                      <p style={{ color: "#6b6656", margin: "4px 0 0" }}>
                        {methodePaiementLabel[paiement.methode] ?? paiement.methode}
                        {" · "}
                        {new Date(paiement.paye_le).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ marginTop: 12 }}
                        onClick={() => genererRecu(paiement)}
                      >
                        Télécharger / imprimer le reçu
                      </button>
                    </div>
                  ))}
                </div>
                {paiements.length === 100 && (
                  <p style={{ color: "#6b6656", fontSize: "0.85rem", marginTop: 12 }}>
                    Les 100 paiements les plus récents sont affichés.
                  </p>
                )}
              </>
            )}
          </div>

          <div style={{ marginTop: 20 }}>
            {notifStatut === "actif" ? (
              <p style={{ color: "var(--emerald)", fontWeight: 600 }}>
                🔔 Notifications activées
              </p>
            ) : (
              <button
                className="btn btn-gold"
                onClick={activerNotifications}
                disabled={notifStatut === "en_cours"}
              >
                {notifStatut === "en_cours" ? "Activation..." : "🔔 Activer les notifications"}
              </button>
            )}
            {notifStatut === "erreur" && (
              <p style={{ color: "#8a2d2d", marginTop: 8 }}>
                Impossible d'activer les notifications sur cet appareil/navigateur.
              </p>
            )}
          </div>

          <div style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: "1.2rem" }}>Notifications</h2>
            {notifications.length === 0 ? (
              <p style={{ color: "#6b6656" }}>Aucune notification pour le moment.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {notifications.map((n) => (
                  <div key={n.id} className="card">
                    <p style={{ fontWeight: 600, margin: 0 }}>{n.titre}</p>
                    <p style={{ color: "#4a463d", margin: "4px 0 0" }}>{n.message}</p>
                    <p style={{ color: "#6b6656", fontSize: "0.8rem", margin: "8px 0 0" }}>
                      {new Date(n.cree_le).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}