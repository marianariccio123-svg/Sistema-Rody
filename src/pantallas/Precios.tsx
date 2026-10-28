import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { coincide, formatearPesos, normalizar, type Receta } from '../cotizador/cotizador';
import { cambiosDePrecios, claveDePrecio, leerPrecio } from '../cotizador/editorPrecios';
import { agregarSabor, cambiarRecetas, eliminarCliente, esRepetido, guardarPrecioEnvase, guardarPrecios, type Cliente, type Datos } from '../datos/datos';

const RECETAS: Receta[] = ['Familiar', 'Artesanal'];
const miles = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

type Toast = { texto: string; ok: boolean } | null;

type Props = {
  datos: Datos;
  alCambiarDatos: () => Promise<void>;   // vuelve a leer la base después de guardar
  alVolver: () => void;
};

export function Precios({ datos, alCambiarDatos, alVolver }: Props) {
  const base = datos.listas.find((l) => l.esBase);
  const [listaId, setListaId] = useState(base?.id ?? datos.listas[0]?.id);
  const [borrador, setBorrador] = useState<Record<string, string>>({});
  const [busqueda, setBusqueda] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const lista = datos.listas.find((l) => l.id === listaId);
  const { cambios, invalidos } = lista ? cambiosDePrecios(lista.precios, borrador) : { cambios: [], invalidos: [] };
  const pendientes = cambios.length + invalidos.length;
  const encontrados = useMemo(() => datos.sabores.filter((s) => coincide(busqueda, s.nombre)), [datos.sabores, busqueda]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const descartarSiHayCambios = () =>
    !pendientes || window.confirm('Hay precios sin guardar en esta lista. ¿Descartarlos?');

  function elegirLista(id: string) {
    if (id === listaId || !descartarSiHayCambios()) return;
    setListaId(id);
    setBorrador({});
  }

  async function guardar() {
    if (!lista) return;
    if (invalidos.length) return setToast({ texto: 'Hay precios mal escritos (marcados en rojo). Escribí solo números, por ejemplo 41.000.', ok: false });
    setGuardando(true);
    try {
      await guardarPrecios(lista.id, cambios);
      await alCambiarDatos();
      setBorrador({});
      setToast({ texto: `Precios guardados (${cambios.length}).`, ok: true });
    } catch {
      setToast({ texto: 'No se pudieron guardar los precios. Revisá la conexión y probá de nuevo.', ok: false });
    }
    setGuardando(false);
  }

  async function alternarReceta(r: Receta) {
    if (!lista) return;
    const recetas = RECETAS.filter((x) => x === r ? !lista.recetas.includes(r) : lista.recetas.includes(x));
    if (!recetas.length) return setToast({ texto: 'La lista tiene que tener al menos una receta.', ok: false });
    try {
      await cambiarRecetas(lista.id, recetas);
      await alCambiarDatos();
    } catch {
      setToast({ texto: 'No se pudo cambiar. Revisá la conexión y probá de nuevo.', ok: false });
    }
  }

  async function eliminar(cliente: Cliente) {
    if (!window.confirm(`¿Eliminar a ${cliente.nombre}? Se borran el cliente y su lista de precios, y no se puede deshacer.`)) return;
    try {
      await eliminarCliente(cliente);
      if (base) setListaId(base.id);
      setBorrador({});
      await alCambiarDatos();
      setToast({ texto: `${cliente.nombre} eliminado.`, ok: true });
    } catch {
      setToast({ texto: 'No se pudo eliminar. Revisá la conexión y probá de nuevo.', ok: false });
    }
  }

  function volver() {
    if (descartarSiHayCambios()) alVolver();
  }

  if (!lista) return null;
  const cliente = datos.clientes.find((c) => c.listaId === lista.id);

  return (
    <div className="app">
      <header className="top-fila">
        <div>
          <p className="eyebrow">Sistema Rody</p>
          <h1>Precios y sabores</h1>
        </div>
        <button type="button" className="link-btn" onClick={volver}>Volver a cotizar</button>
      </header>

      <main className="pagina">
        <section className="bloque" aria-labelledby="t-lista">
          <h2 id="t-lista">Lista de precios</h2>
          <div className="clientes" role="group" aria-label="Elegir lista">
            {base && (
              <button type="button" className="cliente-btn" aria-pressed={listaId === base.id} onClick={() => elegirLista(base.id)}>
                <span>{base.nombre}</span><small>Base para clientes nuevos</small>
              </button>
            )}
            {datos.clientes.map((c) => (
              <button key={c.id} type="button" className="cliente-btn" aria-pressed={listaId === c.listaId} onClick={() => elegirLista(c.listaId)}>
                <span>{c.nombre}</span><small>{datos.listas.find((l) => l.id === c.listaId)?.recetas.join(' y ')}</small>
              </button>
            ))}
          </div>
          <p className="ayuda">
            {lista.esBase
              ? 'Cuando se agrega un cliente, arranca con estos precios. Cambiarlos acá no cambia los de los clientes que ya están cargados.'
              : `Precios que se le cotizan a ${cliente?.nombre ?? 'este cliente'}.`}
          </p>
          <div className="recetas-lista">
            <span className="campo">Recetas que lleva</span>
            <div className="eleccion" role="group" aria-label="Recetas de la lista">
              {RECETAS.map((r) => (
                <button key={r} type="button" className="eleccion-btn cuadrado" aria-pressed={lista.recetas.includes(r)} onClick={() => alternarReceta(r)}>
                  <span className="eleccion-titulo">{r}</span>
                </button>
              ))}
            </div>
          </div>
          {cliente && <button type="button" className="link-btn peligro" onClick={() => eliminar(cliente)}>Eliminar a {cliente.nombre}</button>}
        </section>

        <section className="bloque" aria-labelledby="t-precios">
          <div className="top-fila">
            <h2 id="t-precios">Precios de {cliente?.nombre ?? lista.nombre}</h2>
          </div>
          <div className="buscar-fila">
            <label className="campo">Buscar sabor
              <input className="input" type="search" autoComplete="off" value={busqueda} placeholder="Ej.: dulce de leche" onChange={(e) => setBusqueda(e.target.value)} />
            </label>
          </div>
          <NuevoSabor datos={datos} alAgregar={async (nombre) => { await alCambiarDatos(); setBusqueda(nombre); setToast({ texto: `Sabor agregado: ${nombre}. Cargale el precio en cada lista.`, ok: true }); }} />
          <div className={"tabla-precios" + (lista.recetas.length > 1 ? " varias-recetas" : "")} role="table" aria-label="Precios por sabor">
            <div className="fila-precio encabezado" role="row">
              <span role="columnheader">Sabor</span>
              {lista.recetas.map((r) => <span key={r} role="columnheader">{r}</span>)}
            </div>
            {encontrados.length === 0 && <p className="vacio">No hay sabores que coincidan con "{busqueda}".</p>}
            {encontrados.map((s) => (
              <div key={s.id} className="fila-precio" role="row">
                <span role="rowheader">{s.nombre}</span>
                {lista.recetas.map((r) => {
                  const clave = claveDePrecio(s.id, r);
                  const actual = lista.precios.find((p) => p.saborId === s.id && p.receta === r)?.precio;
                  const valor = borrador[clave] ?? (actual != null ? miles.format(actual) : '');
                  const cambiado = cambios.some((c) => c.saborId === s.id && c.receta === r);
                  return (
                    <span key={r} role="cell" className="celda-precio">
                      <span className="signo">$</span>
                      <input
                        className={'input precio' + (cambiado ? ' cambiado' : '') + (invalidos.includes(clave) ? ' invalido' : '')}
                        inputMode="numeric" autoComplete="off" placeholder="sin precio" aria-label={`${s.nombre} ${r}`}
                        value={valor}
                        onChange={(e) => setBorrador({ ...borrador, [clave]: e.target.value })}
                      />
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        <PrecioEnvase precio={datos.precioEnvase} alGuardar={async () => { await alCambiarDatos(); setToast({ texto: 'Precio del envase guardado.', ok: true }); }} avisar={setToast} />
      </main>

      {pendientes > 0 && (
        <div className="barra-guardar" role="region" aria-label="Cambios sin guardar">
          <span>{pendientes} {pendientes === 1 ? 'cambio' : 'cambios'}</span>
          <button type="button" className="btn sec" onClick={() => setBorrador({})} disabled={guardando}>Descartar</button>
          <button type="button" className="btn" onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
        </div>
      )}
      {toast && <div className={'toast' + (toast.ok ? ' ok' : '') + (pendientes ? ' sobre-barra' : '')} role="status">{toast.texto}</div>}
    </div>
  );
}

function NuevoSabor({ datos, alAgregar }: { datos: Datos; alAgregar: (nombre: string) => Promise<void> }) {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [esperando, setEsperando] = useState(false);
  const campo = useRef<HTMLInputElement>(null);

  useEffect(() => { if (abierto) campo.current?.focus(); }, [abierto]);

  function cerrar() {
    setAbierto(false);
    setNombre('');
    setError('');
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const limpio = nombre.trim().replace(/\s+/g, ' ');
    if (!limpio) return setError('Escribí el nombre del sabor.');
    if (datos.sabores.some((s) => normalizar(s.nombre) === normalizar(limpio))) return setError(`${limpio} ya está en la lista de sabores.`);
    setEsperando(true);
    try {
      await agregarSabor(limpio, Math.max(0, ...datos.sabores.map((s) => s.orden)) + 1);
      await alAgregar(limpio);
      cerrar();
    } catch (e) {
      setError(esRepetido(e) ? `${limpio} ya está en la lista de sabores.` : 'No se pudo agregar. Revisá la conexión y probá de nuevo.');
    }
    setEsperando(false);
  }

  if (!abierto) return <button type="button" className="cliente-btn nuevo agregar-sabor" onClick={() => setAbierto(true)}>+ Agregar sabor</button>;
  return (
    <form className="nuevo-form" onSubmit={enviar} noValidate>
      <label className="campo" htmlFor="nuevo-sabor">Nombre del sabor nuevo</label>
      <div className="nuevo-fila">
        <input ref={campo} className="input" id="nuevo-sabor" type="text" autoComplete="off" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej.: Pistacho" />
        <button type="submit" className="btn" disabled={esperando}>{esperando ? 'Agregando…' : 'Agregar'}</button>
        <button type="button" className="btn sec" onClick={cerrar}>Cancelar</button>
      </div>
      <p className="ayuda">Aparece en todas las listas sin precio. Después cargale el precio en cada lista que lo venda.</p>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}

function PrecioEnvase({ precio, alGuardar, avisar }: { precio: number; alGuardar: () => Promise<void>; avisar: (t: Toast) => void }) {
  const [texto, setTexto] = useState(miles.format(precio));
  const [esperando, setEsperando] = useState(false);
  const nuevo = leerPrecio(texto);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (typeof nuevo !== 'number') return avisar({ texto: 'Escribí el precio del envase en números, por ejemplo 5.000.', ok: false });
    setEsperando(true);
    try {
      await guardarPrecioEnvase(nuevo);
      await alGuardar();
    } catch {
      avisar({ texto: 'No se pudo guardar. Revisá la conexión y probá de nuevo.', ok: false });
    }
    setEsperando(false);
  }

  return (
    <form className="envases" onSubmit={guardar} noValidate>
      <h3>Precio del envase</h3>
      <p className="info">Hoy: {formatearPesos(precio)} cada uno, para todos los clientes.</p>
      <div className="fila">
        <span className="celda-precio">
          <span className="signo">$</span>
          <input className="input precio" inputMode="numeric" autoComplete="off" aria-label="Precio del envase" value={texto} onChange={(e) => setTexto(e.target.value)} />
        </span>
        <button type="submit" className="btn" disabled={esperando || nuevo === precio}>{esperando ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </form>
  );
}
