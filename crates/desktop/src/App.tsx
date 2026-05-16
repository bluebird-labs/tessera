import tesseraLogo from "./assets/tessera-logo-parchment.svg";

export default function App() {
  return (
    <main className="app-shell" aria-label="Tessera desktop startup">
      <section className="brand-stage" aria-labelledby="app-title">
        <img className="brand-mark" src={tesseraLogo} alt="Tessera parchment logo" />
        <div className="startup-copy">
          <p className="kicker">Open-core substrate</p>
          <h1 id="app-title">Tessera</h1>
          <p className="status">Structural graph workspace</p>
        </div>
      </section>
    </main>
  );
}
