"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function AssistantMembre() {
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
        router.replace("/membre");
        return;
      }

      const { data: membre, error } = await supabase
        .from("membres")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (error) {
        setErreur("Impossible de vérifier ton accès membre.");
        return;
      }
      if (!membre) {
        router.replace("/membre");
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
      router.replace("/membre");
      setEnvoi(false);
      return;
    }

    try {
      const response = await fetch("/api/assistant/membre", {
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
    } catch (sendError) {
      setErreur(
        sendError instanceof Error ? sendError.message : "Une erreur inattendue est survenue."
      );
    } finally {
      setEnvoi(false);
    }
  }

  if (!pret) {
    return (
      <main className="container section">
        <p role={erreur ? "alert" : undefined}>{erreur ?? "Vérification de ton accès..."}</p>
      </main>
    );
  }

  return (
    <main>
      <section className="section">
        <div className="container" style={{ maxWidth: 760 }}>
          <Link href="/membre" style={{ color: "var(--emerald)", fontSize: "0.95rem" }}>
            ← Retour à mon espace
          </Link>
          <p className="eyebrow-line" style={{ marginTop: 16 }}>
            Espace membre
          </p>
          <h1 style={{ fontSize: "1.9rem" }}>Assistant IA</h1>
          <p style={{ color: "#6b6656" }}>
            Pose une question sur ta carte, ton profil ou les cotisations enregistrées.
            L’assistant ne peut rien modifier.
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
                  Exemple : « Quel est mon numéro de membre ? » ou « Quelles cotisations sont
                  enregistrées ? »
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
            <label htmlFor="question-assistant-membre">Ta question</label>
            <textarea
              id="question-assistant-membre"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={1500}
              rows={3}
              placeholder="Ex. : Où modifier mon profil ?"
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
            Pour personnaliser ses réponses, ton nom, ton numéro de membre, ta classe, ton statut
            et les 20 derniers paiements enregistrés au maximum sont transmis à Google Gemini.
            Le site ne conserve pas les conversations. Ne partage pas de mot de passe ni de donnée
            personnelle supplémentaire.
          </p>
        </div>
      </section>
    </main>
  );
}
