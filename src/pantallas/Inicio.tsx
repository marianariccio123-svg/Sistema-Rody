// Pantalla provisoria hasta que llegue Nueva cotización (#4): mientras tanto se cotiza con el prototipo.
export function Inicio({ alSalir }: { alSalir: () => void }) {
  return (
    <div className="app">
      <header className="top-fila">
        <div>
          <p className="eyebrow">Sistema Rody</p>
          <h1>Heladería Kokino</h1>
        </div>
        <button type="button" className="link-btn" onClick={alSalir}>Cerrar sesión</button>
      </header>
      <div className="aviso">
        <p><strong>El sistema nuevo está en construcción.</strong> Mientras tanto, las cotizaciones se arman con el prototipo.</p>
        <a className="btn" href="/prototipo/">Abrir el prototipo</a>
      </div>
    </div>
  );
}
