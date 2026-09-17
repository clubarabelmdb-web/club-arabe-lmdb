"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

export default function InfosPaiementAdmin() {
  const router = useRouter();
  const supabase = createClient();

  const [pret, setPret] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const [enregistre, setEnregistre] = useState(false);

  const [nomTresorier, setNomTresorier] = useState("");
  const [waveNumero, setWaveNumero] = useState("");
  const [orangeMoneyNumero, setOrangeMoneyNumero] = useState("");
  const [montantCotisation, setMontantCotisation] = useState("");
  const [instructions, setInstructions] = useState("");

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

    const { data: infos } = await supabase
      .from("infos_paiement")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (infos) {
      setNomTresorier(infos.nom_tresorier ?? "");
      setWaveNumero(infos.wave_numero ?? "");
      setOrangeMoneyNumero(infos.orange_money_numero ?? "");
      setMontantCotisation(infos.montant_cotisation ?? "");
      setInstructions(infos.instructions ?? "");
    }

    setPret(true);
  }

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setEnregistrement(true);
    setEnregistre(false);

    const { error } = await supabase
      .from("infos_paiement")
      .update({
        nom_tresorier: nomTresorier.trim() || null,
        wave_numero: waveNumero.trim() || null,
        orange_money_numero: orangeMoneyNumero.trim() || null,
        montant_cotisation: montantCotisation.trim() || null,
        instructions: instructions.trim() || null,
      })
      .eq("id", 1);

    if (error) {
      alert("Erreur : " + error.message);
    } else {
      setEnregistre(true);
      setTimeout(() => setEnregistre(false), 2500);
    }
    setEnregistrement(false);
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
      <section className="section">
        <div className="container" style={{ maxWidth: 560 }}>
          <Link href="/admin/dashboard" style={{ color: "var(--emerald)", fontSize: "0.95rem" }}>
            ← Retour au tableau de bord
          </Link>
          <p className="eyebrow-line" style={{ marginTop: 16 }}>
            Espace administrateur
          </p>
          <h1 style={{ fontSize: "1.9rem" }}>Infos de paiement (Wave / Orange Money)</h1>
          <p style={{ color: "#6b6656" }}>
            Ces informations s'affichent publiquement sur la page{" "}
            <Link href="/cotisation" style={{ color: "var(--emerald)" }}>
              /cotisation
            </Link>{" "}
            pour que les membres sachent où envoyer leur cotisation.
          </p>

          <form onSubmit={enregistrer} className="card">
            <div className="field">
              <label htmlFor="nomTresorier">Nom du trésorier</label>
              <input
                id="nomTresorier"
                value={nomTresorier}
                onChange={(e) => setNomTresorier(e.target.value)}
              />
            </div>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="wave">Numéro Wave</label>
                <input
                  id="wave"
                  value={waveNumero}
                  onChange={(e) => setWaveNumero(e.target.value)}
                  placeholder="77 123 45 67"
                />
              </div>
              <div className="field">
                <label htmlFor="om">Numéro Orange Money</label>
                <input
                  id="om"
                  value={orangeMoneyNumero}
                  onChange={(e) => setOrangeMoneyNumero(e.target.value)}
                  placeholder="77 123 45 67"
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="montant">Montant de la cotisation (facultatif)</label>
              <input
                id="montant"
                value={montantCotisation}
                onChange={(e) => setMontantCotisation(e.target.value)}
                placeholder="ex : 2000 FCFA / an"
              />
            </div>
            <div className="field">
              <label htmlFor="instructions">Instructions supplémentaires (facultatif)</label>
              <textarea
                id="instructions"
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="ex : Envoie une capture du reçu au bureau après paiement."
              />
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button type="submit" className="btn btn-primary" disabled={enregistrement}>
                {enregistrement ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setNomTresorier("");
                  setWaveNumero("");
                  setOrangeMoneyNumero("");
                  setMontantCotisation("");
                  setInstructions("");
                }}
              >
                🗑️ Vider les champs
              </button>
              {enregistre && <span style={{ color: "var(--emerald)" }}>✅ Enregistré</span>}
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}