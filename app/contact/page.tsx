import ContactForm from "./ContactForm";

export const metadata = { title: "Contact — Club Arabe LMDB" };

export default function Contact() {
  return (
    <main>
      <section className="section">
        <div className="container grid-2">
          <div>
            <p className="eyebrow-line">Contact</p>
            <h1 style={{ fontSize: "2rem" }}>Une question ? Écris-nous</h1>
            <p style={{ color: "#4a463d" }}>
              Club Arabe — Lycée Maba Diakhou Ba
            </p>
            <p style={{ color: "#4a463d" }}>
              Tu peux aussi nous contacter directement au bureau du club ou via
              nos réseaux sociaux.
            </p>
          </div>
          <ContactForm />
        </div>
      </section>
    </main>
  );
}
