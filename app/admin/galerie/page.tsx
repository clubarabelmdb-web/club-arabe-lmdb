"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

type Photo = {
  id: string;
  url: string;
  legende: string | null;
};

type Album = {
  id: string;
  titre: string;
  description: string | null;
  photos: Photo[];
};

export default function GaleriAdmin() {
  const router = useRouter();
  const supabase = createClient();

  const [pret, setPret] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumOuvert, setAlbumOuvert] = useState<string | null>(null);
  const [nouveauTitre, setNouveauTitre] = useState("");
  const [nouvelleDescription, setNouvelleDescription] = useState("");
  const [creation,