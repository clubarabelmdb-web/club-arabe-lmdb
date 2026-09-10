"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

type Administrateur = {
  id: string;
  nom: string;
  poste: string | null;
  role: string;
};

const postes = [
  "Président(e)",
  "Vice-président(e)",
  "Secrétaire",
  "Trésorier(ère)",
  "Responsable communication",
  "Responsable commission",
  "Membre du bureau",
];

export default function BureauAdmin() {
  const router = useRouter();
  const supabase = createClient();

  const [pret, setPret] = useState(false);
  const [estSuperAdmin, setEstSuperAdmin] = useState(false);
  const [administrateurs, setAdministrateurs] = useState<Administrateur[]>([]);
  const [enregistrement, setEnregistrement] = useState<string | null>(null);

  const [nouvelUid, setNouvelUid] = useState("");
  const [nouveauNom, setNouveauNom] = useState("");
  const [nouveauPoste, setNouveauPoste] = useState(postes[0]);
  const [ajout, setAjout] = useState(false);

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
    const { data: monAdmin } = await supabase
      .from("administrateurs")
      .select("id, role")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (!monAdmin) {
      router.push("/admin");
      return;
    }
    setEstSuperAdmin(monAdmin.role === "super_admin");
    await chargerAdministrateurs();
    setPret(true);
  }

  async function chargerAdministrateurs() {
    const { data } = await supabase
      .from("administrateurs")
      .select("id, nom, poste, role")
      .order("cree_le", { ascending: true });
    setAdministrateurs((data as Administrateur[]) ?? []);
  }

  async function changerPoste(id: string, poste: string) {
    setEnregistrement(id);
    const { error } = await supabase.from("administrateurs").update({ poste }).eq("id", id);
    if (error) alert("Erreur : " + error.message);
    await chargerAdministrateurs();
    setEnregistrement(null);
  }

  async function ajouterAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!nouvelUid.trim() || !nouveauNom.trim()) return;
    setAjout(true);

    const { error } = await supabase.from("administrateurs").insert({
      user_id: nouvelUid.trim(),
      nom: nouveauNom.trim(),
      poste: nouveauPoste,
      role: "admin",
    });

    if (error) alert("Erreur : " + error.message);
    setNouvelUid("");
    setNouveauNom("");
    await chargerAdministrateurs();
    setAjout(false);
  }

  async function retirerAdmin(id: string, nom: string) {
    const confirmation = window.confirm(
      `Retirer les droits administrateur de ${nom} ? Cette personne ne pourra plus se connecter à l'espace admin.`
    );
    if (!confirmation) return;
    const { error } = await supabase.from("administrateurs").delete().eq("id", id);
    if (error) alert("Erreur : " + error.message);
    await chargerAdministrateurs();
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
        </div>
      </section>

      {/* LISTE DES ADMINS */}
      <section className="container">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {administrateurs.map((a) => (
            <div key={a.id} className="card" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
              <div>
                <p style={{ fontWeight: 600, margin: 0 }}>
                  {a.nom} {a.role === "super_admin" && "⭐"}
                </p>
              </div>
              {estSuperAdmin ? (
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <select
                    value={a.poste ?? ""}
                    onChange={(e) => changerPoste(a.id, e.target.value)}
                    disabled={enregistrement === a.id}
                    style={{ padding: "8px 12px", border: "1.5px solid var(--line)", borderRadius: 3 }}
                  >
                    <option value="" disabled>
                      Choisir un rôle...
                    </option>
                    {postes.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  {a.role !== "super_admin" && (
                    <button className="btn btn-outline" onClick={() => retirerAdmin(a.id, a.nom)}>
                      🗑️ Retirer
                    </button>
                  )}
                </div>
              ) : (
                <p style={{ color: "var(--emerald)", fontWeight: 600, margin: 0 }}>
                  {a.poste ?? "Rôle non défini"}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* AJOUTER UN ADMIN */}
      {estSuperAdmin && (
        <section className="section">
          <div className="container">
            <form onSubmit={ajouterAdmin} className="card" style={{ maxWidth: 560 }}>
              <h2 style={{ fontSize: "1.1rem", marginBottom: 8 }}>Ajouter un membre du bureau</h2>
              <p style={{ color: "#6b6656", fontSize: "0.9rem", marginBottom: 16 }}>
                Crée d'abord son compte dans Supabase (Authentication &gt; Users &gt; Add
                user), puis colle son UID ici pour lui donner accès et lui
                attribuer un rôle.
              </p>
              <div className="field">
                <label htmlFor="uid">UID (copié depuis Supabase)</label>
                <input
                  id="uid"
                  value={nouvelUid}
                  onChange={(e) => setNouvelUid(e.target.value)}
                  placeholder="a1b2c3d4-..."
                  required
                />
              </div>
              <div className="grid-2">
                <div className="field">
                  <label htmlFor="nom">Nom complet</label>
                  <input
                    id="nom"
                    value={nouveauNom}
                    onChange={(e) => setNouveauNom(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="poste">Rôle</label>
                  <select
                    id="poste"
                    value={nouveauPoste}
                    onChange={(e) => setNouveauPoste(e.target.value)}
                  >
                    {postes.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={ajout}>
                {ajout ? "Ajout..." : "+ Ajouter au bureau"}
              </button>
            </form>
          </div>
        </section>
      )}
    </main>
  );
}