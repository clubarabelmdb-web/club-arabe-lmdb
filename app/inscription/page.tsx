import InscriptionForm from "./InscriptionForm";

export const metadata = { title: "Inscription — Club Arabe LMDB" };

export default function Inscription() {
  return (
    <main>
      <section className="section">
        <div className="container" style={{ maxWidth: 640 }}>
          <p className="eyebrow-line">Rejoindre le club</p>
          <h1 style={{ fontSize: "2rem" }}>Formulaire d'inscription</h1>
          <p style={{ color: "#4a463d", marginBottom: 32 }}>
            Remplis ce formulaire pour envoyer ta demande d'adhésion. Elle sera
            examinée par l'administration du club avant validation.
          </p>
          <InscriptionForm />
        </div>
      </section>
    </main>
  );
}
