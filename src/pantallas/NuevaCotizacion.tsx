import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  calcularCotizacion, coincide, formatearFecha, formatearPesos, normalizar, textoWhatsApp,
  type CotizacionCalculada, type ListaPrecios, type Receta, type Renglon,
} from '../cotizador/cotizador';
import { TERMINAL, guardarClientes, leerClientes, type Cliente } from '../datos/clientes';
import { LISTAS, PRECIO_ENVASE, SABORES, type Sabor } from '../datos/precios';

const HELADERIA = 'Heladería Kokino';

type Toast = { texto: string; ok: boolean } | null;

export function NuevaCotizacion() {
  const [clientes, setClientes] = useState<Cliente[]>(leerClientes);
  const [clienteId, setClienteId] = useState(TERMINAL.id);
  const [renglones, setRenglones] = useState<Renglon[]>([]);
  const [compraEnvases, setCompraEnvases] = useState<boolean | null>(null);
  const [envasesComprados, setEnvasesComprados] = useState(0);
  const [toast, setToast] = useState<Toast>(null);

  const cliente = clientes.find((c) => c.id === clienteId) ?? TERMINAL;
  const lista = LISTAS[cliente.listaId];
  const cotizacion = calcularCotizacion({ lista, precioEnvase: PRECIO_ENVASE, renglones, compraEnvases, envasesComprados });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  function agregarCliente(nombre: string) {
    const existente = clientes.find((c) => normalizar(c.nombre) === normalizar(nombre));
    if (existente) {
      setClienteId(existente.id);
      return setToast({ texto: `${existente.nombre} ya estaba cargado: quedó elegido.`, ok: false });
    }
    const nuevo: Cliente = { id: crypto.randomUUID(), nombre, listaId: 'general', fijo: false };
    const todos = [...clientes, nuevo];
    setClientes(todos);
    guardarClientes(todos);
    setClienteId(nuevo.id);
    setToast({ texto: `Cliente agregado: ${nombre}`, ok: true });
  }

  // Si ya estaba el mismo sabor y receta, se suma en el mismo renglón.
  function agregarSabor(sabor: Sabor, receta: Receta, tachos: number) {
    setRenglones((rs) => rs.some((r) => r.saborId === sabor.id && r.receta === receta)
      ? rs.map((r) => r.saborId === sabor.id && r.receta === receta ? { ...r, tachos: r.tachos + tachos } : r)
      : [...rs, { saborId: sabor.id, sabor: sabor.nombre, receta, tachos }]);
    setToast({ texto: `Agregado: ${tachos} × ${sabor.nombre} (${receta})`, ok: true });
  }

  function cambiarTachos(i: number, tachos: number) {
    setRenglones((rs) => tachos < 1 ? rs.filter((_, j) => j !== i) : rs.map((r, j) => j === i ? { ...r, tachos } : r));
  }

  function elegirEnvases(compra: boolean) {
    setCompraEnvases(compra);
    if (compra && !cotizacion.envasesComprados) setEnvasesComprados(Math.min(1, cotizacion.tachos));
  }

  function empezarDeCero() {
    setRenglones([]);
    setCompraEnvases(null);
    setEnvasesComprados(0);
  }

  return (
    <div className="app">
      <header className="top-fila">
        <div>
          <p className="eyebrow">Sistema Rody</p>
          <h1>Nueva cotización</h1>
        </div>
        {renglones.length > 0 && <button type="button" className="link-btn" onClick={empezarDeCero}>Empezar de cero</button>}
      </header>
      <main className="pagina">
        <Clientes clientes={clientes} elegido={cliente} alElegir={setClienteId} alAgregar={agregarCliente} />
        <div className="grid">
          <Buscador cliente={cliente} lista={lista} alAgregar={agregarSabor} />
          <section className="bloque" aria-labelledby="t-lleva">
            <h2 id="t-lleva">Lo que se lleva</h2>
            <Carrito cotizacion={cotizacion} cliente={cliente} alCambiar={cambiarTachos} />
            <Envases
              cotizacion={cotizacion}
              compraEnvases={compraEnvases}
              alElegir={elegirEnvases}
              alCambiar={(n) => setEnvasesComprados(Math.max(0, Math.min(cotizacion.tachos, n)))}
            />
            <Ticket cotizacion={cotizacion} cliente={cliente} lista={lista} avisar={setToast} />
          </section>
        </div>
      </main>
      {toast && <div className={'toast' + (toast.ok ? ' ok' : '')} role="status">{toast.texto}</div>}
    </div>
  );
}

function Clientes({ clientes, elegido, alElegir, alAgregar }: {
  clientes: Cliente[]; elegido: Cliente; alElegir: (id: string) => void; alAgregar: (nombre: string) => void;
}) {
  const [agregando, setAgregando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const campo = useRef<HTMLInputElement>(null);

  useEffect(() => { if (agregando) campo.current?.focus(); }, [agregando]);

  function cerrar() {
    setAgregando(false);
    setNombre('');
    setError('');
  }

  function enviar(e: FormEvent) {
    e.preventDefault();
    const limpio = nombre.trim().replace(/\s+/g, ' ');
    if (!limpio) {
      setError('Escribí el nombre del cliente.');
      return campo.current?.focus();
    }
    alAgregar(limpio);
    cerrar();
  }

  return (
    <section className="bloque" aria-labelledby="t-cliente">
      <h2 id="t-cliente">Cliente</h2>
      <div className="clientes" role="group" aria-label="Elegir cliente">
        {clientes.map((c) => {
          const lista = LISTAS[c.listaId];
          return (
            <button key={c.id} type="button" className="cliente-btn" aria-pressed={c.id === elegido.id} onClick={() => alElegir(c.id)}>
              <span>{c.nombre}</span>
              <small>{c.fijo ? 'Cliente fijo · ' : ''}{lista.nombre}{lista.recetas.length === 1 ? ` · solo ${lista.recetas[0]}` : ''}</small>
            </button>
          );
        })}
        <button type="button" className="cliente-btn nuevo" aria-expanded={agregando} onClick={() => agregando ? cerrar() : setAgregando(true)}>+ Otro cliente</button>
      </div>
      {agregando && (
        <form className="nuevo-form" onSubmit={enviar} noValidate>
          <label className="campo" htmlFor="nuevo-nombre">Nombre del cliente</label>
          <div className="nuevo-fila">
            <input ref={campo} className="input" id="nuevo-nombre" type="text" autoComplete="off" value={nombre}
              onChange={(e) => setNombre(e.target.value)} placeholder="Ej.: Salón de fiestas Los Álamos" aria-describedby="nuevo-ayuda" />
            <button type="submit" className="btn">Agregar</button>
            <button type="button" className="btn sec" onClick={cerrar}>Cancelar</button>
          </div>
          <p className="ayuda" id="nuevo-ayuda">Queda guardado en este dispositivo para las próximas cotizaciones y cotiza con la Lista general.</p>
          {error && <p className="error" role="alert">{error}</p>}
        </form>
      )}
    </section>
  );
}

const precioEn = (lista: ListaPrecios, saborId: string, receta: Receta) =>
  lista.recetas.includes(receta) ? lista.precios.find((p) => p.saborId === saborId && p.receta === receta)?.precio ?? null : null;

function Buscador({ cliente, lista, alAgregar }: {
  cliente: Cliente; lista: ListaPrecios; alAgregar: (sabor: Sabor, receta: Receta, tachos: number) => void;
}) {
  const [busqueda, setBusqueda] = useState('');
  const [abierto, setAbierto] = useState<string | null>(null);
  const [receta, setReceta] = useState<Receta>('Familiar');
  const [tachos, setTachos] = useState(1);

  const encontrados = useMemo(() => SABORES.filter((s) => coincide(busqueda, s.nombre)), [busqueda]);
  const recetaActual = lista.recetas.includes(receta) ? receta : lista.recetas[0];
  const precioTexto = (s: Sabor, r: Receta) => { const p = precioEn(lista, s.id, r); return p == null ? 'sin precio' : formatearPesos(p); };

  function abrir(id: string) {
    setAbierto(abierto === id ? null : id);
    setReceta('Familiar');
    setTachos(1);
  }

  return (
    <section className="bloque buscar" aria-labelledby="t-agregar">
      <h2 id="t-agregar">Agregar sabor</h2>
      <label className="campo">Buscar entre los {SABORES.length} sabores
        <input className="input" type="search" autoComplete="off" value={busqueda} placeholder="Ej.: dulce de leche"
          onChange={(e) => { setBusqueda(e.target.value); setAbierto(null); }} />
      </label>
      <ul className="resultados">
        {encontrados.length === 0 && <li className="vacio">No hay sabores que coincidan con "{busqueda}".</li>}
        {encontrados.map((s) => {
          const precios = lista.recetas.map((r) => precioEn(lista, s.id, r)).filter((p): p is number => p != null);
          const desde = precios.length ? (lista.recetas.length > 1 ? 'desde ' : '') + formatearPesos(Math.min(...precios)) : 'sin precio';
          return (
            <li key={s.id}>
              <button type="button" className="res-btn" aria-expanded={abierto === s.id} onClick={() => abrir(s.id)}>
                <span>{s.nombre}</span><small className="num">{desde}</small>
              </button>
              {abierto === s.id && (
                <div className="res-panel">
                  {lista.recetas.length > 1 ? (
                    <div className="eleccion" role="group" aria-label="Receta">
                      {lista.recetas.map((r) => (
                        <button key={r} type="button" className="eleccion-btn" aria-pressed={recetaActual === r} onClick={() => setReceta(r)}>
                          <span className="eleccion-titulo">{r}</span><small className="num">{precioTexto(s, r)}</small>
                        </button>
                      ))}
                    </div>
                  ) : (
                    // Si la lista del cliente tiene una sola receta, no hay nada que elegir: se muestra cuál es.
                    <p className="receta-unica">
                      <strong>{lista.recetas[0]}</strong> <span className="num">{precioTexto(s, lista.recetas[0])}</span>{' '}
                      <small className="muted">· {cliente.nombre} compra solo {lista.recetas[0]}</small>
                    </p>
                  )}
                  <Stepper valor={tachos} etiqueta="tachos" alCambiar={(n) => setTachos(Math.max(1, Math.min(999, n)))} />
                  <button type="button" className="btn" onClick={() => { alAgregar(s, recetaActual, tachos); setAbierto(null); }}>Agregar</button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Carrito({ cotizacion, cliente, alCambiar }: { cotizacion: CotizacionCalculada; cliente: Cliente; alCambiar: (i: number, tachos: number) => void }) {
  if (!cotizacion.renglones.length) return <p className="vacio">Todavía no agregaste sabores. Buscalos en la lista.</p>;
  return (
    <ul className="carrito">
      {cotizacion.renglones.map((r, i) => (
        <li key={r.saborId + r.receta}>
          <div>
            <strong>{r.sabor}</strong> <small className="muted">{r.receta}</small>
            {r.estado === 'no-disponible' && <> <span className="chip-warn">{cliente.nombre} no compra {r.receta}</span></>}
          </div>
          <Stepper valor={r.tachos} etiqueta={r.sabor} alCambiar={(n) => alCambiar(i, Math.min(999, n))} />
          <button type="button" className="quitar" aria-label={`Quitar ${r.sabor} ${r.receta}`} onClick={() => alCambiar(i, 0)}>Quitar</button>
        </li>
      ))}
    </ul>
  );
}

function Envases({ cotizacion: c, compraEnvases, alElegir, alCambiar }: {
  cotizacion: CotizacionCalculada; compraEnvases: boolean | null; alElegir: (compra: boolean) => void; alCambiar: (n: number) => void;
}) {
  return (
    <div className="envases">
      <h3>¿Compra envases?</h3>
      <div className="eleccion" role="group" aria-label="¿Compra envases?">
        <button type="button" className="eleccion-btn" aria-pressed={compraEnvases === true} onClick={() => alElegir(true)}>
          <span className="eleccion-titulo">Sí, los compra</span><small className="num">{formatearPesos(PRECIO_ENVASE)} cada uno</small>
        </button>
        <button type="button" className="eleccion-btn" aria-pressed={compraEnvases === false} onClick={() => alElegir(false)}>
          <span className="eleccion-titulo">No, los devuelve</span><small>Quedan prestados</small>
        </button>
      </div>
      {compraEnvases && (
        <div className="fila">
          <span>Envases que compra</span>
          <Stepper valor={c.envasesComprados} etiqueta="envase" alCambiar={alCambiar} />
          <span className="muted num">× {formatearPesos(PRECIO_ENVASE)}</span>
        </div>
      )}
      <p className="info">
        {c.tachos
          ? <>Se lleva {c.tachos} {c.tachos === 1 ? 'tacho' : 'tachos'}: {c.envasesComprados} con envase comprado y <strong>{c.envasesPrestados} con envase prestado</strong> (a devolver). <span className="supuesto">Supone 1 envase por tacho.</span></>
          : 'Cargá sabores para ver los envases.'}
      </p>
    </div>
  );
}

function Ticket({ cotizacion: c, cliente, lista, avisar }: {
  cotizacion: CotizacionCalculada; cliente: Cliente; lista: ListaPrecios; avisar: (t: Toast) => void;
}) {
  const [aMano, setAMano] = useState(false);
  const textoRef = useRef<HTMLTextAreaElement>(null);
  const hoy = new Date();
  const texto = textoWhatsApp(c, { heladeria: HELADERIA, cliente: cliente.nombre, fecha: hoy });
  const nombres = (estado: string) => c.renglones.filter((r) => r.estado === estado).map((r) => `${r.sabor} (${r.receta})`).join(', ');
  const sinPrecio = nombres('sin-precio');
  const noDisponibles = nombres('no-disponible');

  useEffect(() => { if (aMano) textoRef.current?.select(); }, [aMano]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      avisar({ texto: 'Texto copiado. Pegalo en WhatsApp.', ok: true });
    } catch {
      setAMano(true);
      avisar({ texto: 'No se pudo copiar solo: el texto quedó seleccionado para copiarlo a mano.', ok: false });
    }
  }

  return (
    <article className="ticket" aria-label="Cotización para enviar">
      <div className="ticket-head">
        <div>
          <p className="ticket-marca">{HELADERIA}</p>
          <p className="eyebrow">Cotización para</p>
          <h3>{cliente.nombre}</h3>
        </div>
        <span className="num muted">{formatearFecha(hoy)}</span>
      </div>
      {c.renglones.length ? (
        <table>
          <tbody>
            {c.renglones.map((r) => (
              <tr key={r.saborId + r.receta}>
                <td><span className="num">{r.tachos}</span> × {r.sabor} <small className="muted">{r.receta}</small></td>
                <td className="num">{r.subtotal != null ? formatearPesos(r.subtotal) : <span className="chip-warn">{r.estado === 'sin-precio' ? 'sin precio' : 'no disponible'}</span>}</td>
              </tr>
            ))}
            {c.envasesComprados > 0 && (
              <tr><td><span className="num">{c.envasesComprados}</span> × Envase</td><td className="num">{formatearPesos(c.totalEnvases)}</td></tr>
            )}
            <tr className="total-row"><td>Total{c.esParcial ? ' parcial' : ''}</td><td className="num">{formatearPesos(c.total)}</td></tr>
          </tbody>
        </table>
      ) : <p className="nota">Todavía no se cargó ningún sabor.</p>}
      {sinPrecio && <p className="faltan">Falta el precio de {sinPrecio} en la {lista.nombre}. El total no los incluye.</p>}
      {noDisponibles && <p className="faltan">{cliente.nombre} solo compra {lista.recetas.join(' y ')}: quitá {noDisponibles} o elegí otro cliente. El total no los incluye.</p>}
      {c.envasesPrestados > 0 && <p className="nota">Envases prestados a devolver: <strong className="num">{c.envasesPrestados}</strong></p>}
      {c.renglones.length > 0 && (
        <>
          <div className="acciones">
            <button type="button" className="btn" onClick={copiar}>Copiar texto</button>
            <a className="btn sec" href={`https://wa.me/?text=${encodeURIComponent(texto)}`} target="_blank" rel="noopener">Enviar por WhatsApp</a>
          </div>
          {aMano && <textarea ref={textoRef} className="input compartir-texto" readOnly value={texto} />}
        </>
      )}
    </article>
  );
}

function Stepper({ valor, etiqueta, alCambiar }: { valor: number; etiqueta: string; alCambiar: (n: number) => void }) {
  return (
    <span className="stepper">
      <button type="button" aria-label={`Restar ${etiqueta}`} onClick={() => alCambiar(valor - 1)}>−</button>
      <output className="num">{valor}</output>
      <button type="button" aria-label={`Sumar ${etiqueta}`} onClick={() => alCambiar(valor + 1)}>+</button>
    </span>
  );
}
