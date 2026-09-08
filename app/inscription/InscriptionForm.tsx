"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";

const anneesScolaires = ["2025-2026", "2026-2027"];

export default function InscriptionForm() {
  const [statut, setStatut] = useState<"formulaire" | "envoi" | "envoye" | "erreur">("formulaire");
  const [erreur, setErreur] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatut("envoi");
    setErreur("");

    const formData = new FormData(e.currentTarget);
    const supabase = createClient();

    let photoUrl: string | null = null;
    const photoFile = formData.get("photo") as File;

    try {
      if (photoFile && photoFile.size > 0) {
        const chemin = `inscriptions/${Date.now()}-${photoFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("photos-membres")
          .upload(chemin, photoFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("photos-membres").getPublicUrl(chemin);
        photoUrl = data.publicUrl;
      }

      const { error } = await supabase.from("inscriptions").insert({
        prenom: formData.get("prenom"),
        nom: formData.get("nom"),
        classe: formData.get("classe"),
        telephone: formData.get("telephone"),
        email: formData.get("email"),
        annee_scolaire: formData.get("annee_scolaire"),
        photo_url: photoUrl,
      });

      if (error) throw error;
      setStatut("envoye");
    } catch (err: any) {
      setErreur(err.message ?? "Une erreur est survenue. Réessaie.");
      setStatut("erreur");
    }
  }

  if (statut === "envoye") {
    return (
      <div className="card" style={{ borderColor: "var(--emerald)", background: "var(--emerald-soft)" }}>
        <h2 style={{ color: "var(--emerald-deep)", fontSize: "1.3rem" }}>Demande envoyée !</h2>
        <p style={{ color: "#2f4b43" }}>
          Ta demande d'inscription est en attente de validation. L'administration
          du club va vérifier tes informations. Tu recevras une notification dès
          que ta demande sera traitée.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid-2">
        <div className="field">
          <label htmlFor="prenom">Prénom</label>
          <input id="prenom" name="prenom" required />
        </div>
        <div className="field">
          <label htmlFor="nom">Nom</label>
          <input id="nom" name="nom" required />
        </div>
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="classe">Classe</label>
          <input id="classe" name="classe" placeholder="ex : Terminale S2" required />
        </div>
        <div className="field">
          <label htmlFor="annee_scolaire">Année scolaire</label>
          <select id="annee_scolaire" name="annee_scolaire" required defaultValue="">
            <option value="" disabled>
              Choisir...
            </option>
            {anneesScolaires.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="telephone">Numéro de téléphone</label>
          <input id="telephone" name="telephone" type="tel" required />
        </div>
        <div className="field">
          <label htmlFor="email">Adresse e-mail</label>
          <input id="email" name="email" type="email" required />
        </div>
      </div>

      <div className="field">
        <label htmlFor="photo">Photo de profil (facultatif)</label>
        <input id="photo" name="photo" type="file" accept="image/*" />
      </div>

      {statut === "erreur" && (
        <p style={{ color: "#8a2d2d", marginBottom: 16 }}>{erreur}</p>
      )}

      <button type="submit" className="btn btn-primary" disabled={statut === "envoi"}>
        {statut === "envoi" ? "Envoi en cours..." : "Envoyer ma demande"}
      </button>
    </form>
  );
}
