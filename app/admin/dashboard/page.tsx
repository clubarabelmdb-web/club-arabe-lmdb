"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

type Inscription = {
  id: string;
  prenom: string;
  nom: string;
  classe: string;
  telephone: string;
  email: string;
  annee_scolaire: string;
  statut: string;
  cree_le: string;
};

type Membre = {
  id: string;
  numero_membre: string;
  prenom: string;
  nom: string;
  classe: string;
  statut: string;
};

export default function Dashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [pret, setPret] = useState(false);
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [onglet, setOnglet] = useState<"demandes" | "membres">("demandes");
  const [enCours, setEnCours] = useState<string | null>(null);

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
    const { data: insc } = await supabase
      .from("inscriptions")
      .select("*")
      .order("cree_le", { ascending: false });
    setInscriptions((insc as Inscription[]) ?? []);

    const { data: mem } = await supabase
      .from("membres")
      .select("id, numero_membre, prenom, nom, classe, statut")
      .order("cree_le", { ascending: false });
    setMembres((mem as Membre[]) ?? []);
  }

  async function valider(id: string) {
    setEnCours(id);
    const { error } = await supabase.rpc("valider_inscription", { inscription_id_param: id });
    if (error) alert("Erreur : " + error.message);
    await chargerDonnees();
    setEnCours(null);
  }

  async function refuser(id: string) {
    setEnCours(id);
    const { error } = await supabase.rpc("refuser_inscription", { inscription_id_param: id });
    if (error) alert("Erreur : " + error.message);
    await chargerDonnees();
    setEnCours(null);
  }

  if (!pret) {
    return (
      <main className="container section">
        <p>Vérification des accès...</p>
      </main>
    );
  }

  const enAttente = inscriptions.filter((i) => i.statut === "en_attente");

  return (
    <main>
      <section className="section" style={{ paddingBottom: 24 }}>
        <div className="container">
          <p className="eyebrow-line">Espace administrateur</p>
          <h1 style={{ fontSize: "1.9rem" }}>Tableau de bord</h1>

          <div className="grid-4" style={{ marginTop: 24 }}>
            <div className="card">
              <p style={{ fontSize: "2rem", color: "var(--emerald-deep)", margin: 0 }}>
                {membres.length}
              </p>
              <p style={{ color: "#6b6656", margin: 0 }}>Membres</p>
            </div>
            <div className="card">
              <p style={{ fontSize: "2rem", color: "var(--gold)", margin: 0 }}>{enAttente.length}</p>
              <p style={{ color: "#6b6656", margin: 0 }}>Demandes en attente</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container">
        <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--line)" }}>
          {(["demandes", "membres"] as const).map((o) => (
            <button
              key={o}
              onClick={() => setOnglet(o)}
              className="btn"
              style={{
                borderRadius: 0,
                background: "transparent",
                borderBottom: onglet === o ? "3px solid var(--emerald)" : "3px solid transparent",
                color: onglet === o ? "var(--emerald-deep)" : "#6b6656",
                padding: "10px 4px",
                marginRight: 24,
              }}
            >
              {o === "demandes" ? `Demandes (${enAttente.length})` : `Membres (${membres.length})`}
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container">
          {onglet === "demandes" ? (
            enAttente.length === 0 ? (
              <p style={{ color: "#6b6656" }}>Aucune demande en attente.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {enAttente.map((i) => (
                  <div key={i.id} className="card" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                    <div>
                      <p style={{ fontWeight: 600, margin: 0 }}>
                        {i.prenom} {i.nom}
                      </p>
                      <p style={{ color: "#6b6656", margin: 0 }}>
                        {i.classe} · {i.annee_scolaire} · {i.telephone} · {i.email}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        className="btn btn-primary"
                        disabled={enCours === i.id}
                        onClick={() => valider(i.id)}
                      >
                        ✅ Valider
                      </button>
                      <button
                        className="btn btn-outline"
                        disabled={enCours === i.id}
                        onClick={() => refuser(i.id)}
                      >
                        ❌ Refuser
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : membres.length === 0 ? (
            <p style={{ color: "#6b6656" }}>Aucun membre pour le moment.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {membres.map((m) => (
                <div key={m.id} className="card" style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: 0 }}>
                      {m.prenom} {m.nom}
                    </p>
                    <p style={{ color: "#6b6656", margin: 0 }}>{m.classe}</p>
                  </div>
                  <p style={{ fontFamily: "monospace", color: "var(--emerald)", fontWeight: 600 }}>
                    {m.numero_membre}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
