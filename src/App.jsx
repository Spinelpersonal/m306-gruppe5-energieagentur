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
        <FileUpload />
      </main>

    </div>
  );
}

export default App;
