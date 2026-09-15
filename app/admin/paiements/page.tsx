"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

type Membre = {
  id: string;
  prenom: string;
  nom: string;
  numero_membre: string;
};

type Paiement = {
  id: string;
  membre_id: string | null;
  nom_donateur: string | null;
  type_paiement: string;
  montant: number;
  methode: string;
  annee_scolaire: string;
  note: string | null;
  paye_le: string;
  membres: { prenom: string; nom: string; numero_membre: string } | null;
};

const methodesLabel: Record<string, string> = {
  especes: "Espèces",
  orange_money: "Orange Money",
  wave: "Wave",
  autre: "Autre",
};

const typeLabel: Record<string, string> = {
  cotisation: "Cotisation",
  don: "Don",
  autre: "Autre",
};

export default function Paiements() {
  const router = useRouter();
  const supabase = createClient();

  const [pret, setPret] = useState(false);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [enregistrement, setEnregistrement] = useState(false);

  const [modePayeur, setModePayeur] = useState<"membre" | "externe">("membre");
  const [membreId, setMembreId] = useState("");
  const [nomDonateur, setNomDonateur] = useState("");
  const [typePaiement, setTypePaiement] = useState("cotisation");
  const [montant, setMontant] = useState("");
  const [methode, setMethode] = useState("especes");
  const [anneeScolaire, setAnneeScolaire] = useState("2026-2027");
  const [note, setNote] = useState("");

  useEffect(() => {
    verifierAccesEtCharger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verifierAccesEtCharger() {
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
    await chargerDonnees();
    setPret(true);
  }

  async function chargerDonnees() {
    const { data: mem } = await supabase
      .from("membres")
      .select("id, prenom, nom, numero_membre")
      .order("prenom", { ascending: true });
    setMembres((mem as Membre[]) ?? []);

    const { data: pay } = await supabase
      .from("paiements")
      .select(
        "id, membre_id, nom_donateur, type_paiement, montant, methode, annee_scolaire, note, paye_le, membres(prenom, nom, numero_membre)"
      )
      .order("paye_le", { ascending: false });
    setPaiements((pay as any) ?? []);
  }

  async function enregistrerPaiement(e: React.FormEvent) {
    e.preventDefault();
    if (modePayeur === "membre" && !membreId) return;
    if (modePayeur === "externe" && !nomDonateur.trim()) return;
    if (!montant) return;

    setEnregistrement(true);

    const { error } = await supabase.from("paiements").insert({
      membre_id: modePayeur === "membre" ? membreId : null,
      nom_donateur: modePayeur === "externe" ? nomDonateur.trim() : null,
      type_paiement: typePaiement,
      montant: Number(montant),
      methode,
      annee_scolaire: anneeScolaire,
      note: note.trim() || null,
    });

    if (error) alert("Erreur : " + error.message);

    setMembreId("");
    setNomDonateur("");
    setMontant("");
    setNote("");
    await chargerDonnees();
    setEnregistrement(false);
  }

  async function supprimerPaiement(id: string) {
    const confirmation = window.confirm("Supprimer cet enregistrement de paiement ?");
    if (!confirmation) return;
    const { error } = await supabase.from("paiements").delete().eq("id", id);
    if (error) alert("Erreur : " + error.message);
    await chargerDonnees();
  }  function genererRecu(p: Paiement) {
    const nomAffiche = p.membres
      ? `${p.membres.prenom} ${p.membres.nom}`
      : p.nom_donateur ?? "Donateur";
    const numeroAffiche = p.membres ? p.membres.numero_membre : "—";
    const dateAffichee = new Date(p.paye_le).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
        const numeroRecu = p.id.slice(0, 8).toUpperCase();
    const logoUrl = `${window.location.origin}/images/logo.png`;
    const fenetre = window.open("", "_blank");
    if (!fenetre) {
      alert("Ton navigateur a bloqué l'ouverture de la fenêtre. Autorise les pop-ups pour ce site.");
      return;
    }

    fenetre.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <title>Reçu ${numeroRecu} — Club Arabe LMDB</title>
        <style>
          body {
            font-family: Georgia, serif;
            color: #1f2933;
            max-width: 640px;
            margin: 40px auto;
            padding: 0 24px;
          }
          .entete {
            display: flex;
            align-items: center;
            gap: 16px;
            border-bottom: 3px solid #0f5132;
            padding-bottom: 20px;
            margin-bottom: 24px;
          }
          .entete img { width: 64px; height: 64px; border-radius: 50%; }
          .entete h1 { font-size: 1.3rem; color: #0f5132; margin: 0; }
          .entete p { margin: 2px 0 0; color: #6b6656; font-size: 0.9rem; }
          h2 { color: #0f5132; font-size: 1.6rem; margin-bottom: 4px; }
          .numero { color: #6b6656; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
          td { padding: 10px 0; border-bottom: 1px solid #dce3d7; }
          td:first-child { color: #6b6656; }
          td:last-child { text-align: right; font-weight: 600; }
          .montant { font-size: 1.5rem; color: #0f5132; font-weight: 700; text-align: right; }
          .pied { margin-top: 48px; font-size: 0.85rem; color: #6b6656; text-align: center; }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="entete">
            <img src="${logoUrl}" alt="Logo Club Arabe" />
          <div>
            <h1>CLUB ARABE</h1>
            <p>Lycée Maba Diakhou Ba</p>
          </div>
        </div>

        <h2>Reçu de paiement</h2>
        <p class="numero">N° ${numeroRecu} — ${dateAffichee}</p>

        <table>
          <tr><td>Reçu de</td><td>${nomAffiche}</td></tr>
          <tr><td>Numéro de membre</td><td>${numeroAffiche}</td></tr>
          <tr><td>Type</td><td>${typeLabel[p.type_paiement] ?? p.type_paiement}</td></tr>
          <tr><td>Méthode de paiement</td><td>${methodesLabel[p.methode] ?? p.methode}</td></tr>
          <tr><td>Année scolaire</td><td>${p.annee_scolaire}</td></tr>
          ${p.note ? `<tr><td>Note</td><td>${p.note}</td></tr>` : ""}
        </table>

        <p class="montant">${Number(p.montant).toLocaleString("fr-FR")} FCFA</p>

        <p class="pied">
          Reçu généré automatiquement par le Club Arabe — Lycée Maba Diakhou Ba
        </p>

        <script>window.print();</script>
      </body>
      </html>
    `);
    fenetre.document.close();
  }

  if (!pret) {
    return (
      <main className="container section">
        <p>Vérification des accès...</p>
      </main>
    );
  }

  const total = paiements.reduce((somme, p) => somme + Number(p.montant), 0);

  return (
    <main>
      <section className="section" style={{ paddingBottom: 24 }}>
        <div className="container">
          <Link href="/admin/dashboard" style={{ color: "var(--emerald)", fontSize: "0.95rem" }}>
            ← Retour au tableau de bord
          </Link>
          <p className="eyebrow-line" style={{ marginTop: 16 }}>
            Espace administrateur
          </p>
          <h1 style={{ fontSize: "1.9rem" }}>Cotisations et paiements</h1>

          <div className="card" style={{ marginTop: 16, display: "inline-block" }}>
            <p style={{ color: "#6b6656", margin: 0 }}>Total collecté</p>
            <p style={{ fontSize: "1.8rem", color: "var(--emerald-deep)", fontWeight: 700, margin: 0 }}>
              {total.toLocaleString("fr-FR")} FCFA
            </p>
          </div>
        </div>
      </section>

      {/* FORMULAIRE */}
      <section className="container">
        <form onSubmit={enregistrerPaiement} className="card">
          <h2 style={{ fontSize: "1.15rem", marginBottom: 16 }}>Enregistrer un paiement</h2>          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => setModePayeur("membre")}
              className={modePayeur === "membre" ? "btn btn-primary" : "btn btn-outline"}
            >
              Un membre
            </button>
            <button
              type="button"
              onClick={() => {
                setModePayeur("externe");
                setTypePaiement("don");
              }}
              className={modePayeur === "externe" ? "btn btn-primary" : "btn btn-outline"}
            >
              Personne extérieure / don
            </button>
          </div>

          <div className="grid-2">
            {modePayeur === "membre" ? (
              <div className="field">
                <label htmlFor="membre">Membre</label>
                <select
                  id="membre"
                  value={membreId}
                  onChange={(e) => setMembreId(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Choisir un membre...
                  </option>
                  {membres.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.prenom} {m.nom} · {m.numero_membre}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="field">
                <label htmlFor="nomDonateur">Nom de la personne</label>
                <input
                  id="nomDonateur"
                  value={nomDonateur}
                  onChange={(e) => setNomDonateur(e.target.value)}
                  placeholder="ex : Moussa Diop (parent d'élève)"
                  required
                />
              </div>
            )}
            <div className="field">
              <label htmlFor="montant">Montant (FCFA)</label>
              <input
                id="montant"
                type="number"
                min="0"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label htmlFor="type">Type</label>
              <select id="type" value={typePaiement} onChange={(e) => setTypePaiement(e.target.value)}>
                <option value="cotisation">Cotisation</option>
                <option value="don">Don</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="methode">Méthode</label>
              <select id="methode" value={methode} onChange={(e) => setMethode(e.target.value)}>
                <option value="especes">Espèces</option>
                <option value="orange_money">Orange Money</option>
                <option value="wave">Wave</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label htmlFor="annee">Année scolaire</label>
              <select id="annee" value={anneeScolaire} onChange={(e) => setAnneeScolaire(e.target.value)}>
                <option value="2025-2026">2025-2026</option>
                <option value="2026-2027">2026-2027</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="note">Note (facultatif)</label>
              <input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={enregistrement}>
            {enregistrement ? "Enregistrement..." : "+ Enregistrer le paiement"}
          </button>
        </form>
      </section>

      {/* LISTE */}
      <section className="section">
        <div className="container">
          <h2 style={{ fontSize: "1.2rem" }}>Historique des paiements</h2>
          {paiements.length === 0 ? (
            <p style={{ color: "#6b6656" }}>Aucun paiement enregistré pour le moment.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {paiements.map((p) => (
                <div key={p.id} className="card" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: 0 }}>
                      {p.membres ? `${p.membres.prenom} ${p.membres.nom}` : p.nom_donateur ?? "—"}
                      {!p.membres && (
                        <span style={{ color: "var(--gold)", fontWeight: 600, fontSize: "0.8rem", marginLeft: 8 }}>
                          non-membre
                        </span>
                      )}
                    </p>
                    <p style={{ color: "#6b6656", margin: 0 }}>
                      {new Date(p.paye_le).toLocaleDateString("fr-FR")} · {typeLabel[p.type_paiement]} ·{" "}
                      {methodesLabel[p.methode]} · {p.annee_scolaire}
                      {p.note ? ` · ${p.note}` : ""}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <p style={{ fontWeight: 700, color: "var(--emerald-deep)", margin: 0 }}>
                      {Number(p.montant).toLocaleString("fr-FR")} FCFA
                    </p>
                    <button className="btn btn-gold" onClick={() => genererRecu(p)}>
                      🧾 Reçu
                    </button>
                    <button className="btn btn-outline" onClick={() => supprimerPaiement(p.id)}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}