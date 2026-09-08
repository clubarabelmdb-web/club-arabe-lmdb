"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export default function ContactForm() {
  const [statut, setStatut] = useState<"formulaire" | "envoi" | "envoye" | "erreur">("formulaire");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatut("envoi");
    const formData = new FormData(e.currentTarget);
    const supabase = createClient();

    const { error } = await supabase.from("messages_contact").insert({
      nom: formData.get("nom"),
      email: formData.get("email"),
      sujet: formData.get("sujet"),
      contenu: formData.get("contenu"),
    });

    setStatut(error ? "erreur" : "envoye");
  }

  if (statut === "envoye") {
    return (
      <div className="card" style={{ borderColor: "var(--emerald)", background: "var(--emerald-soft)" }}>
        <p style={{ color: "#2f4b43" }}>
          Merci, ton message a bien été envoyé au Club Arabe. Nous te répondrons
          rapidement.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid-2">
        <div className="field">
          <label htmlFor="nom">Nom</label>
          <input id="nom" name="nom" required />
        </div>
        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" required />
        </div>
      </div>
      <div className="field">
        <label htmlFor="sujet">Sujet</label>
        <input id="sujet" name="sujet" />
      </div>
      <div className="field">
        <label htmlFor="contenu">Message</label>
        <textarea id="contenu" name="contenu" rows={5} required />
      </div>
      {statut === "erreur" && (
        <p style={{ color: "#8a2d2d", marginBottom: 16 }}>
          Une erreur est survenue. Réessaie.
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={statut === "envoi"}>
        {statut === "envoi" ? "Envoi..." : "Envoyer le message"}
      </button>
    </form>
  );
}
