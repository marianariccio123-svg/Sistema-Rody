import { createClient } from '@supabase/supabase-js';

// La llave publicable puede ir en el código; lo que protege los datos son las reglas de la base (ver ADR 0001).
const SUPABASE_URL = 'https://jvmotivafwihuygzugdn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_9kT3JjmbT6evuY3CFEfUTQ_6QUhMo0x';

// El link del mail de recuperación vuelve con "type=recovery" (o con un error si venció).
// Se lee antes de crear el cliente, porque Supabase limpia la dirección al leerla.
const hash = new URLSearchParams(location.hash.slice(1));
export const vieneDelMail = hash.get('type') === 'recovery';
export const linkVencido = hash.has('error_code');

export const db = createClient(SUPABASE_URL, SUPABASE_KEY);
