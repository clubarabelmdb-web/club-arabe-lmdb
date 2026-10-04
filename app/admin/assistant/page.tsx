"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function AssistantAdmin() {
  const router = useRouter();
  const supabase = createClient();
  const [pret, setPret] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    async function verifierAcces() {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) {
        router.replace("/admin");
        return;
      }

      const { data: admins, error } = await supabase
        .from("administrateurs")
        .select("id")
        .eq("user_id", session.user.id)
        .limit(1);
      if (error) {
        setErreur("Impossible de vérifier ton accès administrateur.");
        return;
      }
      if (!admins?.length) {
        router.replace("/admin");
        return;
      }
      setPret(true);
    }

    void verifierAcces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function envoyerQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const texte = question.trim();
    if (!texte || envoi) return;

    setErreur(null);
    setEnvoi(true);
    const prochainHistorique = [...messages, { role: "user" as const, content: texte }].slice(-10);
    setMessages(prochainHistorique);
    setQuestion("");

    const { data: session } = await supabase.auth.getSession();
    const accessToken = session.session?.access_token;
    if (!accessToken) {
      router.replace("/admin");
      setEnvoi(false);
      return;
    }

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ messages: prochainHistorique }),
      });
      const data: unknown = await response.json();
      if (!data || typeof data !== "object") {
        throw new Error("Réponse invalide de l’assistant.");
      }
      const result = data as { answer?: unknown; error?: unknown };
      if (!response.ok || typeof result.answer !== "string") {
        throw new Error(
          typeof result.error === "string" ? result.error : "Impossible d’obtenir une réponse."
        );
      }
      setMessages((current) => [...current, { role: "assistant", content: result.answer as string }]);
    } catch (error) {
      setErreur(error instanceof Error ? error.message : "Une erreur inattendue est survenue.");
    } finally {
      setEnvoi(false);
    }
  }

  if (!pret) {
    return (
      <main className="container section">
        <p>{erreur ?? "Vérification des accès..."}</p>
      </main>
    );
  }

  return (
    <main>
      <section className="section">
        <div className="container" style={{ maxWidth: 760 }}>
          <Link href="/admin/dashboard" style={{ color: "var(--emerald)", fontSize: "0.95rem" }}>
            ← Retour au tableau de bord
          </Link>
          <p className="eyebrow-line" style={{ marginTop: 16 }}>
            Espace administrateur
          </p>
          <h1 style={{ fontSize: "1.9rem" }}>Assistant IA</h1>
          <p style={{ color: "#6b6656" }}>
            Pose une question sur le tableau de bord ou demande où trouver une fonction.
            L’assistant ne consulte ni ne modifie les dossiers.
          </p>

          <div
            aria-live="polite"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              margin: "24px 0",
              minHeight: 120,
            }}
          >
            {messages.length === 0 ? (
              <div className="card">
                <p style={{ margin: 0, color: "#6b6656" }}>
                  Exemple : « Comment vérifier une carte de membre ? »
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${index}-${message.role}`}
                  className="card"
                  style={{
                    alignSelf: message.role === "user" ? "flex-end" : "stretch",
                    maxWidth: "90%",
                    whiteSpace: "pre-wrap",
                    background: message.role === "user" ? "var(--emerald-deep)" : undefined,
                    color: message.role === "user" ? "var(--parchment)" : undefined,
                  }}
                >
                  <strong>{message.role === "user" ? "Toi" : "Assistant"}</strong>
                  <p style={{ margin: "6px 0 0" }}>{message.content}</p>
                </div>
              ))
            )}
            {envoi && <p role="status">L’assistant prépare une réponse…</p>}
          </div>

          {erreur && (
            <p role="alert" style={{ color: "#8a2d2d" }}>
              {erreur}
            </p>
          )}

          <form onSubmit={envoyerQuestion} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label htmlFor="question-assistant">Ta question</label>
            <textarea
              id="question-assistant"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={1500}
              rows={3}
              placeholder="Ex. : Où puis-je gérer les activités ?"
              required
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1.5px solid var(--line)",
                borderRadius: 3,
                font: "inherit",
                resize: "vertical",
              }}
            />
            <button type="submit" className="btn btn-primary" disabled={envoi || !question.trim()}>
              {envoi ? "Envoi..." : "Envoyer"}
            </button>
          </form>
          <p style={{ color: "#6b6656", fontSize: "0.85rem", marginTop: 16 }}>
            Évite d’inclure des mots de passe, des clés ou des informations personnelles dans tes questions.
            Les conversations ne sont pas enregistrées par le site.
          </p>
        </div>
      </section>
    </main>
  );
}
