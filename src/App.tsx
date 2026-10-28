import { useEffect, useState } from 'react';
import { normalizar, type Receta } from './cotizador/cotizador';
import { cargarDatos, crearCliente, esRepetido, type Datos } from './datos/datos';
import { db, linkVencido, vieneDelMail } from './datos/supabase';
import { Acceso, type Mensaje, type PantallaAcceso } from './pantallas/Acceso';
import { NuevaCotizacion } from './pantallas/NuevaCotizacion';
import { Precios } from './pantallas/Precios';

type Pantalla = 'cargando' | 'sin-conexion' | PantallaAcceso | 'cotizar' | 'precios';

export function App() {
  const [pantalla, setPantalla] = useState<Pantalla>('cargando');
  const [mensaje, setMensaje] = useState<Mensaje>(null);
  const [datos, setDatos] = useState<Datos | null>(null);

  useEffect(() => {
    db.auth.getSession().then(({ data }) => {
      if (location.hash) history.replaceState(null, '', location.pathname);   // que recargar no repita el link
      if (linkVencido) return irA('recuperar', { texto: 'El link venció o ya se usó. Pedí uno nuevo.' });
      if (vieneDelMail && data.session) return irA('nueva-clave');
      if (data.session) entrar(); else irA('login');
    });
  }, []);

  function irA(p: PantallaAcceso, m: Mensaje = null) {
    setMensaje(m);
    setPantalla(p);
  }

  async function entrar() {
    setPantalla('cargando');
    try {
      setDatos(await traerClientesDeEsteDispositivo(await cargarDatos()));
      setPantalla('cotizar');
    } catch {
      setPantalla('sin-conexion');
    }
  }

  const recargar = async () => setDatos(await cargarDatos());

  async function agregarCliente(nombre: string, recetas: Receta[]) {
    const existente = datos?.clientes.find((c) => normalizar(c.nombre) === normalizar(nombre));
    if (existente) return { id: existente.id, yaExistia: true };
    const id = await crearCliente(nombre, normalizar(nombre), recetas);
    await recargar();
    return { id, yaExistia: false };
  }

  async function salir() {
    await db.auth.signOut();
    setDatos(null);
    irA('login');
  }

  if (pantalla === 'cargando') return <p className="cargando">Cargando…</p>;
  if (pantalla === 'sin-conexion') {
    return (
      <div className="login">
        <div className="login-form">
          <h1>No se pudieron cargar los datos</h1>
          <p className="ayuda">Revisá la conexión a internet y probá de nuevo.</p>
          <button type="button" className="btn" onClick={entrar}>Probar de nuevo</button>
          <button type="button" className="link-btn" onClick={salir}>Cerrar sesión</button>
        </div>
      </div>
    );
  }
  if (pantalla === 'cotizar' && datos) {
    return <NuevaCotizacion datos={datos} alCrearCliente={agregarCliente} alEditarPrecios={() => setPantalla('precios')} alSalir={salir} />;
  }
  if (pantalla === 'precios' && datos) {
    return <Precios datos={datos} alCambiarDatos={recargar} alVolver={() => setPantalla('cotizar')} />;
  }
  return <Acceso pantalla={pantalla as PantallaAcceso} mensajeInicial={mensaje} irA={irA} alEntrar={entrar} />;
}

// La versión sin base de datos (ADR 0002) guardaba en cada navegador los clientes agregados.
// La primera vez que se entra desde ese dispositivo, se pasan a la base con la Lista general y se borran del navegador.
const CLAVE_VIEJA = 'sistema-rody:clientes';

async function traerClientesDeEsteDispositivo(datos: Datos): Promise<Datos> {
  let viejos: { nombre: string }[] = [];
  try {
    viejos = JSON.parse(localStorage.getItem(CLAVE_VIEJA) ?? '[]');
  } catch {
    return datos;
  }
  const faltan = viejos.filter((v) => !datos.clientes.some((c) => normalizar(c.nombre) === normalizar(v.nombre)));
  for (const v of faltan) {
    try {
      await crearCliente(v.nombre, normalizar(v.nombre), ['Familiar', 'Artesanal']);
    } catch (e) {
      if (!esRepetido(e)) throw e;   // ya lo había subido otro dispositivo, o estaba dos veces
    }
  }
  try { localStorage.removeItem(CLAVE_VIEJA); } catch { /* sin almacenamiento: no hay nada que borrar */ }
  return faltan.length ? cargarDatos() : datos;
}
