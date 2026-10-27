// Precios provisorios del Excel "Precios 22/04/26 Terminal". Para un aumento, cambiar los números acá y subir el cambio.
// Columnas: sabor, Lista Terminal (solo Familiar), Lista general Familiar, Lista general Artesanal. null = sin precio en esa lista.
import type { ListaPrecios, PrecioEnLista } from '../cotizador/cotizador';

export const PRECIO_ENVASE = 5000;

const TABLA: [string, number | null, number | null, number | null][] = [
  ['Ananá',                      41000, 26000, 31200],
  ['Durazno',                    41000, 26000, 31200],
  ['Limón',                      41000, 26000, 31200],
  ['Frutilla al agua',           41000, 26000, 31200],
  ['Ananá al Champagne',         46000, 35000, 42000],
  ['Arándanos',                  46000, 35000, 42000],
  ['Vainilla',                   48000, 35000, 42000],
  ['Crema Americana',            48000, 35000, 42000],
  ['Flan al Caramelo',           52000, 35000, 42000],
  ['Granizado',                  52000, 35000, 42000],
  ['Banana Split',               52000, 35000, 42000],
  ['Frutos del Bosque',          52000, 35000, 42000],
  ['Frutilla a la crema',        52000, 35000, 42000],
  ['Crema del Cielo',            52000, 35000, 42000],
  ['Chocolate',                  58000, 40000, 48000],
  ['Dulce de Leche',             58000, 40000, 48000],
  ['Dulce de leche granizado',   60000, 40000, 48000],
  ['Chocolate blanco',           58000, 40000, 48000],
  ['Dulce de leche goloso',      60000,  null,  null],
  ['Mousse Limón',               60000, 40000, 48000],
  ['Dulce de leche con nuez',    60000, 48000, 57600],
  ['Menta',                      60000,  null,  null],
  ['Crema Rusa',                 60000, 48000, 57600],
  ['Tentación',                  60000,  null,  null],
  ['Kokino',                     60000,  null,  null],
  ['Maracuyá',                   60000,  null,  null],
  ['Coquicukis',                 60000,  null,  null],
  ['Almendrado',                 60000, 48000, 57600],
  ['Chocotorta',                 60000,  null,  null],
  ['Coco y dulce de leche',      60000, 48000, 57600],
  ['Melón',                      65000, 48000, 57600],
  ['Crema Oriental',             65000, 48000, 57600],
  ['Cerezas a la crema',         69000, 60000, 72000],
  ['Kinotos al wiski',           58000, 48000, 57600],
  ['Higos al coñac',             58000, 48000, 57600],
  ['Chocolate a la cubana',      58000, 48000, 57600],
  ['Chocolate con almendras',    65000, 48000, 57600],
  ['Sambayón',                   70000, 60000, 72000],
  ['Rocher',                     80000, 60000, 72000],
  ['Amargo',                     70000, 60000, 72000],
];

export type Sabor = { id: string; nombre: string };

const idDe = (nombre: string) =>
  nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const SABORES: Sabor[] = TABLA.map(([nombre]) => ({ id: idDe(nombre), nombre }));

function precios(columnas: { receta: PrecioEnLista['receta']; columna: 1 | 2 | 3 }[]): PrecioEnLista[] {
  return TABLA.flatMap((fila) => columnas
    .filter(({ columna }) => fila[columna] != null)
    .map(({ receta, columna }) => ({ saborId: idDe(fila[0]), receta, precio: fila[columna]! })));
}

export const LISTAS = {
  terminal: { nombre: 'Lista Terminal', recetas: ['Familiar'], precios: precios([{ receta: 'Familiar', columna: 1 }]) },
  general: {
    nombre: 'Lista general',
    recetas: ['Familiar', 'Artesanal'],
    precios: precios([{ receta: 'Familiar', columna: 2 }, { receta: 'Artesanal', columna: 3 }]),
  },
} satisfies Record<string, ListaPrecios>;

export type ListaId = keyof typeof LISTAS;
