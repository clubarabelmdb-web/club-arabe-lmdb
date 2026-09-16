import { createClient } from "@/lib/supabaseClient";

export const metadata = { title: "Cotisation — Club Arabe LMDB" };
export const revalidate = 60;

async function getInfosPaiement() {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("infos_paiement")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

export default async function Cotisation() {
  const infos = await getInfosPaiement();
  const rienDeRenseigne =
    !infos || (!infos.wave_numero && !infos.orange_money_numero);

  return (
    <main>
      <section className="section">
        <div className="container" style={{ maxWidth: 560 }}>
          <p className="eyebrow-line">Cotisation</p>
          <h1 style={{ fontSize: "2rem" }}>Comment payer ma cotisation ?</h1>

          {infos?.montant_cotisation && (
            <p style={{ fontSize: "1.15rem", color: "#4a463d" }}>
              Montant : <strong>{infos.montant_cotisation}</strong>
            </p>
          )}

          {rienDeRenseigne ? (
            <p style={{ color: "#6b6656", marginTop: 16 }}>
              Les informations de paiement seront bientôt disponibles ici.
              Contacte le bureau du club en attendant.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
              {infos?.wave_numero && (
                <div className="card">
                  <p style={{ fontWeight: 600, color: "var(--emerald-deep)", margin: 0 }}>
                    💙 Wave
                  </p>
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "1.4rem",
                      margin: "8px 0 0",
                      color: "var(--emerald)",
                    }}
                  >
                    {infos.wave_numero}
                  </p>
                </div>
              )}
              {infos?.orange_money_numero && (
                <div className="card">
                  <p style={{ fontWeight: 600, color: "var(--emerald-deep)", margin: 0 }}>
                    🧡 Orange Money
                  </p>
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "1.4rem",
                      margin: "8px 0 0",
                      color: "var(--emerald)",
                    }}
                  >
                    {infos.orange_money_numero}
                  </p>
                </div>
              )}
            </div>
          )}

          {infos?.nom_tresorier && (
            <p style={{ color: "#6b6656", marginTop: 20 }}>
              Trésorier : {infos.nom_tresorier}
            </p>
          )}

          {infos?.instructions && (
            <div className="card" style={{ marginTop: 20, background: "var(--emerald-soft)" }}>
              <p style={{ margin: 0, color: "#2f4b43" }}>{infos.instructions}</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}