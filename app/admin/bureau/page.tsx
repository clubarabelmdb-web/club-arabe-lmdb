"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

type Poste = {
  id: string;
  poste: string;
  nom: string;
  ordre: number;
};

export default function BureauAdmin() {
  const router = useRouter();
  const supabase = createClient();

  const [pret, setPret] = useState(false);
  const [postes, setPostes] = useState<Poste[]>([]);
  const [enregistrement, setEnregistrement] = useState<string | null>(null);

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
    await chargerPostes();
    setPret(true);
  }

  async function chargerPostes() {
    const { data } = await supabase.from("bureau").select("*").order("ordre", { ascending: true });
    setPostes((data as Poste[]) ?? []);
  }

  function modifierNomLocal(id: string, nom: string) {
    setPostes((prev) => prev.map((p) => (p.id === id ? { ...p, nom } : p)));
  }

  async function enregistrerNom(id: string, nom: string) {
    setEnregistrement(id);
    const { error } = await supabase.from("bureau").update({ nom }).eq("id", id);
    if (error) alert("Erreur : " + error.message);
    setEnregistrement(null);
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
        <div className="container">
          <Link href="/admin/dashboard" style={{ color: "var(--emerald)", fontSize: "0.95rem" }}>
            ← Retour au tableau de bord
          </Link>
          <p className="eyebrow-line" style={{ marginTop: 16 }}>
            Espace administrateur
          </p>
          <h1 style={{ fontSize: "1.9rem" }}>Le bureau du club</h1>
          <p style={{ color: "#6b6656" }}>
            Renseigne le nom de chaque responsable. Ces informations apparaissent
            sur la page "À propos" du site — aucun compte de connexion n'est créé
            pour eux.
          </p>
        </div>
      </section>

      <section className="container">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {postes.map((p) => (
            <div key={p.id} className="card" style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <p style={{ fontWeight: 600, margin: 0, minWidth: 180 }}>{p.poste}</p>
              <input
                value={p.nom}
                onChange={(e) => modifierNomLocal(p.id, e.target.value)}
                onBlur={(e) => enregistrerNom(p.id, e.target.value)}
                style={{ flex: 1, minWidth: 200 }}
              />
              {enregistrement === p.id && (
                <span style={{ color: "#6b6656", fontSize: "0.85rem" }}>Enregistrement...</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}