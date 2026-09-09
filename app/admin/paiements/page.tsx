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
  membre_id: string;
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

export default function Paiements() {
  const router = useRouter();
  const supabase = createClient();

  const [pret, setPret] = useState(false);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [enregistrement, setEnregistrement] = useState(false);

  const [membreId, setMembreId] = useState("");
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
      .select("id, membre_id, montant, methode, annee_scolaire, note, paye_le, membres(prenom, nom, numero_membre)")
      .order("paye_le", { ascending: false });
    setPaiements((pay as any) ?? []);
  }

  async function enregistrerPaiement(e: React.FormEvent) {
    e.preventDefault();
    if (!membreId || !montant) return;
    setEnregistrement(true);

    const { error } = await supabase.from("paiements").insert({
      membre_id: membreId,
      montant: Number(montant),
      methode,
      annee_scolaire: anneeScolaire,
      note: note.trim() || null,
    });

    if (error) alert("Erreur : " + error.message);

    setMembreId("");
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
          <h2 style={{ fontSize: "1.15rem", marginBottom: 16 }}>Enregistrer un paiement</h2>
          <div className="grid-2">
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
              <label htmlFor="methode">Méthode</label>
              <select id="methode" value={methode} onChange={(e) => setMethode(e.target.value)}>
                <option value="especes">Espèces</option>
                <option value="orange_money">Orange Money</option>
                <option value="wave">Wave</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="annee">Année scolaire</label>
              <select id="annee" value={anneeScolaire} onChange={(e) => setAnneeScolaire(e.target.value)}>
                <option value="2025-2026">2025-2026</option>
                <option value="2026-2027">2026-2027</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="note">Note (facultatif)</label>
            <input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
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
                      {p.membres ? `${p.membres.prenom} ${p.membres.nom}` : "Membre supprimé"}
                    </p>
                    <p style={{ color: "#6b6656", margin: 0 }}>
                      {new Date(p.paye_le).toLocaleDateString("fr-FR")} · {methodesLabel[p.methode]} ·{" "}
                      {p.annee_scolaire}
                      {p.note ? ` · ${p.note}` : ""}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <p style={{ fontWeight: 700, color: "var(--emerald-deep)", margin: 0 }}>
                      {Number(p.montant).toLocaleString("fr-FR")} FCFA
                    </p>
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