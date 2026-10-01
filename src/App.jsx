import FileUpload from "./components/FileUpload";

function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="container header__inner">
          <img className="header__logo" src="/favicon.png" alt="" />
          <div>
            <h1 className="header__title">EnergyChart</h1>
            <p className="header__subtitle">SDAT- &amp; ESL-Viewer</p>
          </div>
        </div>
      </header>

      <main className="container main">
        <div className="intro">
          <p className="eyebrow">Energiedaten einfach auswerten</p>
          <h2 className="intro__title">Messdaten hochladen und direkt analysieren</h2>
          <p className="intro__text">
            XML-Dateien einlesen, Verbrauch und Einspeisung vergleichen und
            Ergebnisse als CSV oder Bild exportieren.
          </p>
        </div>
        <FileUpload />
      </main>

      <footer className="footer container">EnergyChart · 2026</footer>
    </div>
  );
}

export default App;
