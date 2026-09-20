"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

export default function ProfilMembre() {
  const router = useRouter();
  const supabase = createClient();

  const [chargement, setChargement] = useState(true);
  const [membreId, setMembreId] = useState<string | null>(null);
  const [numeroMembre, setNumeroMembre] = useState("");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [classe, setClasse] = useState("");
  const [telephone, setTelephone] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [nouvellePhoto, setNouvellePhoto] = useState<File | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);
  const [succes, setSucces] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function charger() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push("/membre");
      return;
    }
    const { data: m } = await supabase
      .from("membres")
      .select("id, numero_membre, prenom, nom, classe, telephone, photo_url")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (!m) {
      router.push("/membre");
      return;
    }

    setMembreId(m.id);
    setNumeroMembre(m.numero_membre);
    setPrenom(m.prenom);
    setNom(m.nom);
    setClasse(m.classe);
    setTelephone(m.telephone);
    setPhotoUrl(m.photo_url);
    setChargement(false);
  }

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    if (!membreId) return;
    setErreur("");
    setEnregistrement(true);
    setSucces(false);

    try {
      let urlPhoto = photoUrl;

      if (nouvellePhoto) {
        const chemin = `${membreId}/${Date.now()}-${nouvellePhoto.name}`;
        const { error: uploadError } = await supabase.storage
          .from("photos-membres")
          .upload(chemin, nouvellePhoto);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("photos-membres").getPublicUrl(chemin);
        urlPhoto = data.publicUrl;
      }

      const { error } = await supabase
        .from("membres")
        .update({
          prenom: prenom.trim(),
          nom: nom.trim(),
          classe: classe.trim(),
          telephone: telephone.trim(),
          photo_url: urlPhoto,
        })
        .eq("id", membreId);

      if (error) throw error;

      setPhotoUrl(urlPhoto);
      setNouvellePhoto(null);
      setSucces(true);
      setTimeout(() => setSucces(false), 2500);
    } catch (err: any) {
      setErreur(err.message || "Une erreur est survenue.");
    }
    setEnregistrement(false);
  }

  if (chargement) {
    return (
      <main className="container section">
        <p>Chargement...</p>
      </main>
    );
  }

  return (
    <main>
      <section className="section" style={{ maxWidth: 480, margin: "0 auto" }}>
        <div className="container">
          <Link href="/membre" style={{ color: "var(--emerald)", fontSize: "0.95rem" }}>
            ← Retour à mon espace
          </Link>
          <p className="eyebrow-line" style={{ marginTop: 16 }}>
            {numeroMembre}
          </p>
          <h1 style={{ fontSize: "1.7rem" }}>Mon profil</h1>

          <form onSubmit={enregistrer} className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt={prenom}
                  style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: "var(--emerald-soft)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    color: "var(--emerald-deep)",
                    fontSize: "1.3rem",
                  }}
                >
                  {prenom[0]}
                  {nom[0]}
                </div>
              )}
              <div className="field" style={{ margin: 0, flex: 1 }}>
                <label htmlFor="photo">Changer ma photo</label>
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNouvellePhoto(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="field">
                <label htmlFor="prenom">Prénom</label>
                <input id="prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="nom">Nom</label>
                <input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
              </div>
            </div>

            <div className="grid-2">
              <div className="field">
                <label htmlFor="classe">Classe</label>
                <input id="classe" value={classe} onChange={(e) => setClasse(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="telephone">Téléphone</label>
                <input
                  id="telephone"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  required
                />
              </div>
            </div>

            {erreur && <p style={{ color: "#8a2d2d", marginBottom: 16 }}>{erreur}</p>}

            <button type="submit" className="btn btn-primary" disabled={enregistrement}>
              {enregistrement ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
            {succes && (
              <span style={{ marginLeft: 12, color: "var(--emerald)" }}>✅ Enregistré</span>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}