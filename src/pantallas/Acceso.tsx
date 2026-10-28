import { useState, type FormEvent, type ReactNode } from 'react';
import { db } from '../datos/supabase';

export type PantallaAcceso = 'login' | 'recuperar' | 'nueva-clave';
export type Mensaje = { texto: string; ok?: boolean } | null;

type Props = {
  pantalla: PantallaAcceso;
  mensajeInicial?: Mensaje;
  irA: (pantalla: PantallaAcceso, mensaje?: Mensaje) => void;
  alEntrar: () => void;
};

// Tres pantallas: entrar, pedir el mail para recuperar y elegir la contraseña nueva (al volver desde el mail).
export function Acceso({ pantalla, mensajeInicial = null, irA, alEntrar }: Props) {
  const [mail, setMail] = useState('');
  const props = { mail, setMail, mensajeInicial, irA, alEntrar };
  return (
    <section className="login">
      {pantalla === 'login' && <Login {...props} />}
      {pantalla === 'recuperar' && <Recuperar {...props} />}
      {pantalla === 'nueva-clave' && <NuevaClave {...props} />}
    </section>
  );
}

type PropsPantalla = Omit<Props, 'pantalla'> & { mail: string; setMail: (m: string) => void };

function Login({ mail, setMail, mensajeInicial, irA, alEntrar }: PropsPantalla) {
  const [clave, setClave] = useState('');
  const [mensaje, setMensaje] = useState<Mensaje>(mensajeInicial ?? null);
  const [esperando, setEsperando] = useState(false);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    if (!mail.trim() || !clave) return setMensaje({ texto: 'Escribí tu mail y tu contraseña.' });
    setEsperando(true);
    const { error } = await db.auth.signInWithPassword({ email: mail.trim(), password: clave });
    setEsperando(false);
    if (error) return setMensaje({ texto: 'Mail o contraseña incorrectos.' });
    alEntrar();
  }

  return (
    <Formulario titulo="Iniciar sesión" alEnviar={entrar} mensaje={mensaje}>
      <label className="campo">Mail
        <input className="input" type="email" autoComplete="username" value={mail} onChange={(e) => setMail(e.target.value)} />
      </label>
      <CampoClave id="login-clave" etiqueta="Contraseña" autoComplete="current-password" valor={clave} alCambiar={setClave} />
      <button type="submit" className="btn" disabled={esperando}>{esperando ? 'Entrando…' : 'Entrar'}</button>
      <button type="button" className="link-btn" onClick={() => irA('recuperar')}>¿Olvidaste tu contraseña?</button>
    </Formulario>
  );
}

function Recuperar({ mail, setMail, mensajeInicial, irA }: PropsPantalla) {
  const [mensaje, setMensaje] = useState<Mensaje>(mensajeInicial ?? null);
  const [esperando, setEsperando] = useState(false);

  async function pedirLink(e: FormEvent) {
    e.preventDefault();
    const email = mail.trim();
    if (!email) return setMensaje({ texto: 'Escribí tu mail.' });
    setEsperando(true);
    const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
    setEsperando(false);
    if (error) return setMensaje({ texto: 'No se pudo enviar el mail. Esperá unos minutos y probá de nuevo.' });
    // Mismo mensaje exista o no la cuenta, para no revelar qué mails están cargados.
    setMensaje({ texto: `Si ${email} tiene una cuenta, te llega un mail con el link. Revisá también la carpeta de spam.`, ok: true });
  }

  return (
    <Formulario titulo="Recuperar contraseña" alEnviar={pedirLink} mensaje={mensaje}>
      <p className="ayuda">Escribí tu mail y te mandamos un link para elegir una contraseña nueva.</p>
      <label className="campo">Mail
        <input className="input" type="email" autoComplete="username" value={mail} onChange={(e) => setMail(e.target.value)} />
      </label>
      <button type="submit" className="btn" disabled={esperando}>{esperando ? 'Enviando…' : 'Enviar link'}</button>
      <button type="button" className="link-btn" onClick={() => irA('login')}>Volver a iniciar sesión</button>
    </Formulario>
  );
}

function NuevaClave({ mensajeInicial, alEntrar }: PropsPantalla) {
  const [clave, setClave] = useState('');
  const [mensaje, setMensaje] = useState<Mensaje>(mensajeInicial ?? null);
  const [esperando, setEsperando] = useState(false);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (clave.length < 6) return setMensaje({ texto: 'La contraseña tiene que tener al menos 6 caracteres.' });
    setEsperando(true);
    const { error } = await db.auth.updateUser({ password: clave });
    setEsperando(false);
    if (error) return setMensaje({ texto: 'No se pudo guardar. Si el link venció, pedí uno nuevo desde "¿Olvidaste tu contraseña?".' });
    alEntrar();
  }

  return (
    <Formulario titulo="Contraseña nueva" alEnviar={guardar} mensaje={mensaje}>
      <CampoClave id="nueva-clave" etiqueta="Contraseña nueva (mínimo 6 caracteres)" autoComplete="new-password" valor={clave} alCambiar={setClave} />
      <button type="submit" className="btn" disabled={esperando}>{esperando ? 'Guardando…' : 'Guardar y entrar'}</button>
    </Formulario>
  );
}

function Formulario({ titulo, alEnviar, mensaje, children }: { titulo: string; alEnviar: (e: FormEvent) => void; mensaje: Mensaje; children: ReactNode }) {
  return (
    <form className="login-form" onSubmit={alEnviar} noValidate>
      <div>
        <p className="eyebrow">Sistema Rody</p>
        <h1>{titulo}</h1>
      </div>
      {children}
      {mensaje && <p className={'mensaje' + (mensaje.ok ? ' ok' : '')} role="alert">{mensaje.texto}</p>}
    </form>
  );
}

// Contraseña con un ojo adentro del campo para verla u ocultarla.
function CampoClave({ id, etiqueta, autoComplete, valor, alCambiar }: { id: string; etiqueta: string; autoComplete: string; valor: string; alCambiar: (v: string) => void }) {
  const [ver, setVer] = useState(false);
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      <div className="clave">
        <input className="input" id={id} type={ver ? 'text' : 'password'} autoComplete={autoComplete} value={valor} onChange={(e) => alCambiar(e.target.value)} />
        <button type="button" className="ojo" aria-pressed={ver} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setVer(!ver)}>
          {ver ? <OjoTachado /> : <Ojo />}
        </button>
      </div>
    </div>
  );
}

const Ojo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const OjoTachado = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7c2 0 3.8.7 5.2 1.6M22 12s-3.6 7-10 7c-2 0-3.8-.7-5.2-1.6" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /><path d="M3 3l18 18" />
  </svg>
);
