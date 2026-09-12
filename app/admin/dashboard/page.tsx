"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  photo_url: string | null;
};

type Membre = {
  id: string;
  numero_membre: string;
  prenom: string;
  nom: string;
  classe: string;
  telephone: string;
  email: string;
  annee_scolaire: string;
  statut: string;
  photo_url: string | null;
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
      .select("id, numero_membre, prenom, nom, classe, telephone, email, annee_scolaire, statut, photo_url")
      .order("cree_le", { ascending: false });
    setMembres((mem as Membre[]) ?? []);
  }

  async function valider(id: string) {
    setEnCours(id);
    const { data: nouveauMembre, error } = await supabase.rpc("valider_inscription", {
      inscription_id_param: id,
    });
    if (error) {
      alert("Erreur : " + error.message);
      setEnCours(null);
      return;
    }

    // Crée automatiquement le compte du membre et lui envoie l'invitation
    try {
      const reponse = await fetch("/api/inviter-membre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membreId: nouveauMembre.id }),
      });
      if (!reponse.ok) {
        const { error: erreurInvitation } = await reponse.json();
        alert(
          "Le membre a été validé, mais l'envoi de l'invitation a échoué : " +
            erreurInvitation
        );
      }
    } catch {
      alert("Le membre a été validé, mais l'envoi de l'invitation a échoué.");
    }

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

  async function supprimerMembre(id: string, nomComplet: string) {
    const confirmation = window.confirm(
      `Supprimer définitivement ${nomComplet} ? Cette action est irréversible.`
    );
    if (!confirmation) return;

    setEnCours(id);
    const { error } = await supabase.from("membres").delete().eq("id", id);
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