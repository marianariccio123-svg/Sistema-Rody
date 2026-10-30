import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  calcularCotizacion, coincide, formatearFecha, formatearPesos, normalizar, precioConDescuento, textoWhatsApp,
  type CotizacionCalculada, type ListaPrecios, type Receta, type Renglon,
} from '../cotizador/cotizador';
import type { Cliente, Datos, Lista, Sabor } from '../datos/datos';

const HELADERIA = 'Heladería Kokino';
const RECETAS: Receta[] = ['Familiar', 'Artesanal'];

// Cada dispositivo recuerda el último cliente elegido; la primera vez arranca con Terminal.
const CLAVE_ULTIMO_CLIENTE = 'sistema-rody:ultimo-cliente';
const leerUltimoCliente = () => { try { return localStorage.getItem(CLAVE_ULTIMO_CLIENTE); } catch { return null; } };

// El cliente cotiza con su lista (la Lista general, o una especial como la de Terminal), solo en las recetas que lleva.
function listaDe(datos: Datos, cliente: Cliente | undefined): Lista {
  const lista = datos.listas.find((l) => l.id === cliente?.listaId);
  if (!lista || !cliente) return { id: '', nombre: '', recetas: [], esBase: false, precios: [] };
  return { ...lista, recetas: lista.recetas.filter((r) => cliente.recetas.includes(r)) };
}

// Porcentaje entero entre 0 y 100; lo que no es un número cuenta como 0.
const leerPorcentaje = (texto: string) => Math.max(0, Math.min(100, Math.floor(Number(texto) || 0)));

type Toast = { texto: string; ok: boolean } | null;

type Props = {
  datos: Datos;
  // Devuelve el id del cliente creado, o el del que ya existía con ese nombre.
  alCrearCliente: (nombre: string, recetas: Receta[], descuento: number) => Promise<{ id: string; yaExistia: boolean }>;
  alEditarPrecios: () => void;
  alSalir: () => void;
};

export function NuevaCotizacion({ datos, alCrearCliente, alEditarPrecios, alSalir }: Props) {
  const { clientes, sabores, precioEnvase } = datos;
  const [clienteId, setClienteId] = useState<string | null>(leerUltimoCliente);
  const [renglones, setRenglones] = useState<Renglon[]>([]);
  const [compraEnvases, setCompraEnvases] = useState<boolean | null>(null);
  const [envasesComprados, setEnvasesComprados] = useState(0);
  // Descuento de esta cotización; mientras no se toque, vale el habitual del cliente elegido.
  const [descuentoElegido, setDescuentoElegido] = useState<{ clienteId: string; aplica: boolean; porcentaje: number } | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const cliente = clientes.find((c) => c.id === clienteId)
    ?? clientes.find((c) => normalizar(c.nombre) === 'terminal') ?? clientes[0];

  function elegirCliente(id: string) {
    setClienteId(id);
    try { localStorage.setItem(CLAVE_ULTIMO_CLIENTE, id); } catch { /* sin almacenamiento: arranca con Terminal */ }
  }
  const lista = listaDe(datos, cliente);
  const habitual = cliente?.descuento ?? 0;
  const descuento = descuentoElegido && descuentoElegido.clienteId === cliente?.id
    ? descuentoElegido
    : { clienteId: cliente?.id ?? '', aplica: habitual > 0, porcentaje: habitual };
  const cotizacion = calcularCotizacion({
    lista, precioEnvase, renglones, compraEnvases, envasesComprados, descuento: descuento.aplica ? descuento.porcentaje : 0,
  });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  async function agregarCliente(nombre: string, recetas: Receta[], descuentoHabitual: number) {
    try {
      const { id, yaExistia } = await alCrearCliente(nombre, recetas, descuentoHabitual);
      elegirCliente(id);
      setToast(yaExistia
        ? { texto: 'Ese cliente ya estaba cargado: quedó elegido.', ok: false }
        : { texto: `Cliente agregado: ${nombre}`, ok: true });
      return true;
    } catch {
      setToast({ texto: 'No se pudo agregar el cliente. Revisá la conexión y probá de nuevo.', ok: false });
      return false;
    }
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
    setDescuentoElegido(null);
  }

  return (
    <div className="app">
      <header className="top">
        <div className="top-fila">
          <div>
            <p className="eyebrow">Sistema Rody</p>
            <h1>Nueva cotización</h1>
          </div>
          <button type="button" className="link-btn" onClick={alSalir}>Cerrar sesión</button>
        </div>
        <div className="top-acciones">
          <button type="button" className="btn sec" onClick={alEditarPrecios}>Precios, sabores y clientes</button>
          {renglones.length > 0 && <button type="button" className="link-btn" onClick={empezarDeCero}>Empezar de cero</button>}
        </div>
      </header>
      <main className="pagina">
        <Clientes datos={datos} elegido={cliente} alElegir={elegirCliente} alAgregar={agregarCliente} />
        {cliente && <div className="grid">
          <Buscador sabores={sabores} lista={lista} descuento={cotizacion.descuento} alAgregar={agregarSabor} />
          <section className="bloque" aria-labelledby="t-lleva">
            <h2 id="t-lleva">Lo que se lleva</h2>
            <Carrito cotizacion={cotizacion} cliente={cliente} alCambiar={cambiarTachos} />
            <Descuento
              cotizacion={cotizacion}
              aplica={descuento.aplica}
              porcentaje={descuento.porcentaje}
              habitual={habitual}
              alCambiar={(aplica, porcentaje) => setDescuentoElegido({ clienteId: cliente.id, aplica, porcentaje })}
            />
            <Envases
              cotizacion={cotizacion}
              precioEnvase={precioEnvase}
              compraEnvases={compraEnvases}
              alElegir={elegirEnvases}
              alCambiar={(n) => setEnvasesComprados(Math.max(0, Math.min(cotizacion.tachos, n)))}
            />
            <Ticket cotizacion={cotizacion} cliente={cliente} lista={lista} avisar={setToast} />
          </section>
        </div>}
      </main>
      {toast && <div className={'toast' + (toast.ok ? ' ok' : '')} role="status">{toast.texto}</div>}
    </div>
  );
}

function Clientes({ datos, elegido, alElegir, alAgregar }: {
  datos: Datos; elegido: Cliente | undefined; alElegir: (id: string) => void; alAgregar: (nombre: string, recetas: Receta[], descuento: number) => Promise<boolean>;
}) {
  const [agregando, setAgregando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [recetas, setRecetas] = useState<Receta[]>(RECETAS);
  const [descuento, setDescuento] = useState('');
  const [error, setError] = useState('');
  const [esperando, setEsperando] = useState(false);
  const campo = useRef<HTMLInputElement>(null);

  useEffect(() => { if (agregando) campo.current?.focus(); }, [agregando]);

  function cerrar() {
    setAgregando(false);
    setNombre('');
    setRecetas(RECETAS);
    setDescuento('');
    setError('');
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const limpio = nombre.trim().replace(/\s+/g, ' ');
    if (!limpio) {
      setError('Escribí el nombre del cliente.');
      return campo.current?.focus();
    }
    if (!recetas.length) return setError('Elegí al menos una receta.');
    if (!/^\d{0,3}$/.test(descuento.trim()) || Number(descuento) > 100) return setError('El descuento tiene que ser un número entre 0 y 100.');
    setEsperando(true);
    const ok = await alAgregar(limpio, recetas, leerPorcentaje(descuento));
    setEsperando(false);
    if (ok) cerrar();
  }

  const alternarReceta = (r: Receta) =>
    setRecetas(RECETAS.filter((x) => x === r ? !recetas.includes(r) : recetas.includes(x)));

  return (
    <section className="bloque" aria-labelledby="t-cliente">
      <h2 id="t-cliente">Cliente</h2>
      <div className="clientes" role="group" aria-label="Elegir cliente">
        {datos.clientes.map((c) => (
          <button key={c.id} type="button" className="cliente-btn" aria-pressed={c.id === elegido?.id} onClick={() => alElegir(c.id)}>
            <span>{c.nombre}</span>
            <small>{listaDe(datos, c).recetas.join(' y ')}{c.descuento ? ` · ${c.descuento}% de descuento` : ''}</small>
          </button>
        ))}
        <button type="button" className="cliente-btn nuevo" aria-expanded={agregando} onClick={() => agregando ? cerrar() : setAgregando(true)}>+ Otro cliente</button>
      </div>
      {agregando && (
        <form className="nuevo-form" onSubmit={enviar} noValidate>
          <label className="campo" htmlFor="nuevo-nombre">Nombre del cliente</label>
          <div className="nuevo-fila">
            <input ref={campo} className="input" id="nuevo-nombre" type="text" autoComplete="off" value={nombre}
              onChange={(e) => setNombre(e.target.value)} placeholder="Ej.: Salón de fiestas Los Álamos" aria-describedby="nuevo-ayuda" />
          </div>
          <p className="campo">Recetas que lleva</p>
          <div className="eleccion" role="group" aria-label="Recetas que lleva">
            {RECETAS.map((r) => (
              <button key={r} type="button" className="eleccion-btn cuadrado" aria-pressed={recetas.includes(r)} onClick={() => alternarReceta(r)}>
                <span className="eleccion-titulo">{r}</span>
              </button>
            ))}
          </div>
          <label className="campo">Descuento habitual (opcional)
            <span className="con-sufijo">
              <input className="input input-corto num" id="nuevo-descuento" type="number" inputMode="numeric" min={0} max={100}
                value={descuento} onChange={(e) => setDescuento(e.target.value)} placeholder="0" /> %
            </span>
          </label>
          <p className="ayuda" id="nuevo-ayuda">Cotiza con la Lista general menos su descuento habitual, que se puede cambiar en cada cotización.</p>
          <div className="nuevo-fila">
            <button type="submit" className="btn" disabled={esperando}>{esperando ? 'Agregando…' : 'Agregar cliente'}</button>
            <button type="button" className="btn sec" onClick={cerrar}>Cancelar</button>
          </div>
          {error && <p className="error" role="alert">{error}</p>}
        </form>
      )}
    </section>
  );
}

function Buscador({ sabores, lista, descuento, alAgregar }: {
  sabores: Sabor[]; lista: ListaPrecios; descuento: number; alAgregar: (sabor: Sabor, receta: Receta, tachos: number) => void;
}) {
  const [busqueda, setBusqueda] = useState('');
  const [abierto, setAbierto] = useState<string | null>(null);
  const [receta, setReceta] = useState<Receta>('Familiar');
  const [tachos, setTachos] = useState(1);

  const encontrados = useMemo(() => sabores.filter((s) => coincide(busqueda, s.nombre)), [sabores, busqueda]);
  const recetaActual = lista.recetas.includes(receta) ? receta : lista.recetas[0];
  // Con descuento se muestra el precio final y, al lado, el de lista como referencia para el dueño.
  const precioTexto = (s: Sabor, r: Receta) => {
    const deLista = precioConDescuento(lista, s.id, r);
    const final = precioConDescuento(lista, s.id, r, descuento);
    if (deLista == null || final == null) return 'sin precio';
    return final === deLista ? formatearPesos(deLista) : `${formatearPesos(final)} · lista ${formatearPesos(deLista)}`;
  };

  function abrir(id: string) {
    setAbierto(abierto === id ? null : id);
    setReceta('Familiar');
    setTachos(1);
  }

  return (
    <section className="bloque buscar" aria-labelledby="t-agregar">
      <h2 id="t-agregar">Agregar sabor</h2>
      <label className="campo">Buscar entre los {sabores.length} sabores
        <input className="input" type="search" autoComplete="off" value={busqueda} placeholder="Ej.: dulce de leche"
          onChange={(e) => { setBusqueda(e.target.value); setAbierto(null); }} />
      </label>
      <ul className="resultados">
        {encontrados.length === 0 && <li className="vacio">No hay sabores que coincidan con "{busqueda}".</li>}
        {encontrados.map((s) => {
          const precios = lista.recetas.map((r) => precioConDescuento(lista, s.id, r, descuento)).filter((p): p is number => p != null);
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
                      <strong>{lista.recetas[0]}</strong> <span className="num">{precioTexto(s, lista.recetas[0])}</span>
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

function Descuento({ cotizacion: c, aplica, porcentaje, habitual, alCambiar }: {
  cotizacion: CotizacionCalculada; aplica: boolean; porcentaje: number; habitual: number; alCambiar: (aplica: boolean, porcentaje: number) => void;
}) {
  const campo = useRef<HTMLInputElement>(null);
  // Si se elige "Con descuento" y el cliente no tiene uno habitual, el cursor va al porcentaje.
  useEffect(() => { if (aplica && !porcentaje) campo.current?.focus(); }, [aplica]);

  const helado = c.total - c.totalEnvases;
  // Solo lo ve el dueño: en la cotización y en el mensaje aparecen los precios ya descontados.
  const info = aplica && !porcentaje ? 'Escribí el porcentaje de descuento.'
    : !c.descuento ? 'El cliente paga el precio de lista.'
    : <>Helado a precio de lista {formatearPesos(helado + c.montoDescuento)}, menos {c.descuento}% ({formatearPesos(c.montoDescuento)}): <strong>{formatearPesos(helado)}</strong>. Al cliente solo le llega el precio final, sin mencionar el descuento.</>;

  return (
    <div className="descuento">
      <h3>Descuento</h3>
      <div className="eleccion" role="group" aria-label="Descuento">
        <button type="button" className="eleccion-btn" aria-pressed={!aplica} onClick={() => alCambiar(false, porcentaje)}>
          <span className="eleccion-titulo">Sin descuento</span><small>Precio de lista</small>
        </button>
        <button type="button" className="eleccion-btn" aria-pressed={aplica} onClick={() => alCambiar(true, porcentaje || habitual)}>
          <span className="eleccion-titulo">Con descuento</span><small>{habitual ? `Habitual: ${habitual}%` : 'Elegís el porcentaje'}</small>
        </button>
      </div>
      {aplica && (
        <label className="fila" htmlFor="descuento">
          <span>Porcentaje</span>
          <span className="con-sufijo">
            <input ref={campo} className="input input-corto num" id="descuento" type="number" inputMode="numeric" min={1} max={100}
              value={porcentaje || ''} placeholder="0" onChange={(e) => alCambiar(true, leerPorcentaje(e.target.value))} /> %
          </span>
        </label>
      )}
      <p className="info">{info}</p>
    </div>
  );
}

function Envases({ cotizacion: c, precioEnvase, compraEnvases, alElegir, alCambiar }: {
  cotizacion: CotizacionCalculada; precioEnvase: number; compraEnvases: boolean | null; alElegir: (compra: boolean) => void; alCambiar: (n: number) => void;
}) {
  return (
    <div className="envases">
      <h3>¿Compra envases?</h3>
      <div className="eleccion" role="group" aria-label="¿Compra envases?">
        <button type="button" className="eleccion-btn" aria-pressed={compraEnvases === true} onClick={() => alElegir(true)}>
          <span className="eleccion-titulo">Sí, los compra</span><small className="num">{formatearPesos(precioEnvase)} cada uno</small>
        </button>
        <button type="button" className="eleccion-btn" aria-pressed={compraEnvases === false} onClick={() => alElegir(false)}>
          <span className="eleccion-titulo">No, los devuelve</span><small>Quedan prestados</small>
        </button>
      </div>
      {compraEnvases && (
        <div className="fila">
          <span>Envases que compra</span>
          <Stepper valor={c.envasesComprados} etiqueta="envase" alCambiar={alCambiar} />
          <span className="muted num">× {formatearPesos(precioEnvase)}</span>
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
