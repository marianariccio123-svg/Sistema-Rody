// Capa fina sobre Supabase: lee y guarda, sin reglas de negocio (esas viven en el Cotizador).
import type { ListaPrecios, PrecioEnLista, Receta } from '../cotizador/cotizador';
import type { CambioPrecio } from '../cotizador/editorPrecios';
import { db } from './supabase';

export type Sabor = { id: string; nombre: string; orden: number };
export type Lista = ListaPrecios & { id: string; esBase: boolean };
// recetas: las que lleva; descuento: porcentaje habitual sobre el precio de lista del helado.
export type Cliente = { id: string; nombre: string; listaId: string; recetas: Receta[]; descuento: number };
export type Datos = { sabores: Sabor[]; listas: Lista[]; clientes: Cliente[]; precioEnvase: number };

// Supabase devuelve como mucho 1000 filas por consulta: los precios se traen de a tandas.
async function todosLosPrecios() {
  const filas: { lista_id: string; sabor_id: string; receta: Receta; precio: number }[] = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await db.from('precios').select('lista_id, sabor_id, receta, precio')
      .order('lista_id').order('sabor_id').order('receta').range(desde, desde + 999);
    if (error) throw error;
    filas.push(...data);
    if (data.length < 1000) return filas;
  }
}

export async function cargarDatos(): Promise<Datos> {
  const [sabores, listas, clientes, ajustes, precios] = await Promise.all([
    db.from('sabores').select('id, nombre, orden').order('orden'),
    db.from('listas_precios').select('id, nombre, recetas, es_base'),
    db.from('clientes').select('id, nombre, lista_id, recetas, descuento').order('nombre'),
    db.from('ajustes').select('precio_envase').single(),
    todosLosPrecios(),
  ]);
  for (const r of [sabores, listas, clientes, ajustes]) if (r.error) throw r.error;

  const porLista = new Map<string, PrecioEnLista[]>();
  for (const p of precios) {
    if (!porLista.has(p.lista_id)) porLista.set(p.lista_id, []);
    porLista.get(p.lista_id)!.push({ saborId: p.sabor_id, receta: p.receta, precio: p.precio });
  }
  return {
    sabores: sabores.data!,
    listas: listas.data!.map((l) => ({ id: l.id, nombre: l.nombre, recetas: l.recetas, esBase: l.es_base, precios: porLista.get(l.id) ?? [] })),
    clientes: clientes.data!.map((c) => ({ id: c.id, nombre: c.nombre, listaId: c.lista_id, recetas: c.recetas, descuento: c.descuento })),
    precioEnvase: ajustes.data!.precio_envase,
  };
}

// Los clientes nuevos cotizan con la Lista general (ADR 0004).
export async function crearCliente(c: { nombre: string; nombreNormalizado: string; listaId: string; recetas: Receta[]; descuento: number }): Promise<string> {
  const { data, error } = await db.from('clientes')
    .insert({ nombre: c.nombre, nombre_normalizado: c.nombreNormalizado, lista_id: c.listaId, recetas: c.recetas, descuento: c.descuento })
    .select('id').single();
  if (error) throw error;
  return data.id;
}

export async function guardarCliente(id: string, cambios: { recetas?: Receta[]; descuento?: number }) {
  const { error } = await db.from('clientes').update(cambios).eq('id', id);
  if (error) throw error;
}

export async function guardarPrecios(listaId: string, cambios: CambioPrecio[]) {
  const nuevos = cambios.filter((c) => c.precio != null)
    .map((c) => ({ lista_id: listaId, sabor_id: c.saborId, receta: c.receta, precio: c.precio }));
  if (nuevos.length) {
    const { error } = await db.from('precios').upsert(nuevos);
    if (error) throw error;
  }
  // Borrar un precio deja ese sabor sin precio en la lista.
  for (const c of cambios.filter((c) => c.precio == null)) {
    const { error } = await db.from('precios').delete().match({ lista_id: listaId, sabor_id: c.saborId, receta: c.receta });
    if (error) throw error;
  }
}

// Borra solo el cliente: su lista de precios puede ser la Lista general, que comparten todos.
export async function eliminarCliente(cliente: Cliente) {
  const { error } = await db.from('clientes').delete().eq('id', cliente.id);
  if (error) throw error;
}

export async function cambiarRecetas(listaId: string, recetas: Receta[]) {
  const { error } = await db.from('listas_precios').update({ recetas }).eq('id', listaId);
  if (error) throw error;
}

export async function agregarSabor(nombre: string, orden: number): Promise<string> {
  const { data, error } = await db.from('sabores').insert({ nombre, orden }).select('id').single();
  if (error) throw error;
  return data.id;
}

export async function guardarPrecioEnvase(precio: number) {
  const { error } = await db.from('ajustes').update({ precio_envase: precio }).eq('id', 1);
  if (error) throw error;
}

// Postgres avisa con este código cuando se repite un valor único (un cliente o sabor que ya existe).
export const esRepetido = (e: unknown) => (e as { code?: string })?.code === '23505';
