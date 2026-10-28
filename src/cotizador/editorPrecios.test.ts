import { describe, expect, it } from 'vitest';
import { cambiosDePrecios, claveDePrecio, leerPrecio } from './editorPrecios';
import type { PrecioEnLista } from './cotizador';

describe('leer un precio escrito', () => {
  it('acepta el número solo, con puntos de miles o con signo pesos', () => {
    expect(leerPrecio('41000')).toBe(41000);
    expect(leerPrecio('41.000')).toBe(41000);
    expect(leerPrecio(' $ 41.000 ')).toBe(41000);
  });

  it('vacío quiere decir sin precio', () => {
    expect(leerPrecio('')).toBeNull();
    expect(leerPrecio('   ')).toBeNull();
  });

  it('rechaza texto, decimales y cero', () => {
    expect(leerPrecio('cuarenta')).toBe('invalido');
    expect(leerPrecio('41000,50')).toBe('invalido');
    expect(leerPrecio('0')).toBe('invalido');
  });
});

describe('cambios de precios', () => {
  const lista: PrecioEnLista[] = [
    { saborId: 'chocolate', receta: 'Familiar', precio: 40000 },
    { saborId: 'chocolate', receta: 'Artesanal', precio: 48000 },
  ];

  it('solo devuelve los precios que cambiaron', () => {
    const borrador = {
      [claveDePrecio('chocolate', 'Familiar')]: '42.000',
      [claveDePrecio('chocolate', 'Artesanal')]: '48000',
    };
    expect(cambiosDePrecios(lista, borrador)).toEqual({
      cambios: [{ saborId: 'chocolate', receta: 'Familiar', precio: 42000 }],
      invalidos: [],
    });
  });

  it('cargar un precio que no estaba lo agrega, y borrarlo lo deja sin precio', () => {
    const borrador = {
      [claveDePrecio('menta', 'Familiar')]: '60000',
      [claveDePrecio('chocolate', 'Artesanal')]: '',
    };
    expect(cambiosDePrecios(lista, borrador).cambios).toEqual([
      { saborId: 'menta', receta: 'Familiar', precio: 60000 },
      { saborId: 'chocolate', receta: 'Artesanal', precio: null },
    ]);
  });

  it('dejar vacío un sabor que ya no tenía precio no es un cambio', () => {
    expect(cambiosDePrecios(lista, { [claveDePrecio('menta', 'Familiar')]: '' }).cambios).toEqual([]);
  });

  it('separa los precios mal escritos para avisar', () => {
    const borrador = { [claveDePrecio('chocolate', 'Familiar')]: 'mucho' };
    expect(cambiosDePrecios(lista, borrador)).toEqual({ cambios: [], invalidos: [claveDePrecio('chocolate', 'Familiar')] });
  });
});
