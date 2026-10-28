// Reglas para editar los precios de una lista: leer lo que escribe el dueño y ver qué cambió.
import type { PrecioEnLista, Receta } from './cotizador';

// precio null = el sabor queda sin precio en esa lista y receta.
export type CambioPrecio = { saborId: string; receta: Receta; precio: number | null };

export const claveDePrecio = (saborId: string, receta: Receta) => `${saborId}|${receta}`;

// Pesos enteros: acepta "41000", "41.000" o "$ 41.000". Vacío = sin precio.
export function leerPrecio(texto: string): number | null | 'invalido' {
  const limpio = texto.trim().replace(/^\$\s*/, '');
  if (!limpio) return null;
  if (!/^\d{1,3}(\.\d{3})+$|^\d+$/.test(limpio)) return 'invalido';
  const precio = Number(limpio.replace(/\./g, ''));
  return precio > 0 ? precio : 'invalido';
}

// borrador: lo que hay escrito en cada campo que el dueño tocó, por clave de precio.
export function cambiosDePrecios(precios: PrecioEnLista[], borrador: Record<string, string>) {
  const cambios: CambioPrecio[] = [];
  const invalidos: string[] = [];
  for (const [clave, texto] of Object.entries(borrador)) {
    const [saborId, receta] = clave.split('|') as [string, Receta];
    const precio = leerPrecio(texto);
    if (precio === 'invalido') {
      invalidos.push(clave);
      continue;
    }
    const actual = precios.find((p) => p.saborId === saborId && p.receta === receta)?.precio ?? null;
    if (precio !== actual) cambios.push({ saborId, receta, precio });
  }
  return { cambios, invalidos };
}
