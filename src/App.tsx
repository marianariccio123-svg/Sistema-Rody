import { useEffect, useState } from 'react';
import { db, linkVencido, vieneDelMail } from './datos/supabase';
import { Acceso, type Mensaje, type PantallaAcceso } from './pantallas/Acceso';
import { Inicio } from './pantallas/Inicio';

type Pantalla = 'cargando' | PantallaAcceso | 'sistema';

export function App() {
  const [pantalla, setPantalla] = useState<Pantalla>('cargando');
  const [mensaje, setMensaje] = useState<Mensaje>(null);

  useEffect(() => {
    db.auth.getSession().then(({ data }) => {
      if (location.hash) history.replaceState(null, '', location.pathname);   // que recargar no repita el link
      if (linkVencido) return irA('recuperar', { texto: 'El link venció o ya se usó. Pedí uno nuevo.' });
      if (vieneDelMail && data.session) return irA('nueva-clave');
      setPantalla(data.session ? 'sistema' : 'login');
    });
  }, []);

  function irA(p: PantallaAcceso, m: Mensaje = null) {
    setMensaje(m);
    setPantalla(p);
  }

  async function salir() {
    await db.auth.signOut();
    irA('login');
  }

  if (pantalla === 'cargando') return null;
  if (pantalla === 'sistema') return <Inicio alSalir={salir} />;
  return <Acceso pantalla={pantalla} mensajeInicial={mensaje} irA={irA} alEntrar={() => setPantalla('sistema')} />;
}
