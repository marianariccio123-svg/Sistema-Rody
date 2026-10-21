import { describe, expect, it } from 'vitest';
import {
  calcularCotizacion,
  coincide,
  envasesAdeudados,
  normalizar,
  textoWhatsApp,
  type ListaPrecios,
  type Renglon,
} from './cotizador';

// Precios reales del Excel "Precios 22/04/26 Terminal" (los mismos de supabase/esquema.sql).
const listaTerminal: ListaPrecios = {
  nombre: 'Lista Terminal',
  recetas: ['Familiar'],
  precios: [
    { saborId: 'chocolate', receta: 'Familiar', precio: 58000 },
    { saborId: 'dulce-de-leche', receta: 'Familiar', precio: 58000 },
    { saborId: 'frutilla-crema', receta: 'Familiar', precio: 52000 },
    { saborId: 'menta', receta: 'Familiar', precio: 60000 },
  ],
};

const listaGeneral: ListaPrecios = {
  nombre: 'Lista general',
  recetas: ['Familiar', 'Artesanal'],
  precios: [
    { saborId: 'chocolate', receta: 'Familiar', precio: 40000 },
    { saborId: 'chocolate', receta: 'Artesanal', precio: 48000 },
    { saborId: 'dulce-de-leche', receta: 'Familiar', precio: 40000 },
    { saborId: 'dulce-de-leche', receta: 'Artesanal', precio: 48000 },
    { saborId: 'frutilla-crema', receta: 'Familiar', precio: 35000 },
    { saborId: 'frutilla-crema', receta: 'Artesanal', precio: 42000 },
  ],
};

const PRECIO_ENVASE = 5000;

const chocolate = (tachos: number, receta: Renglon['receta'] = 'Familiar'): Renglon =>
  ({ saborId: 'chocolate', sabor: 'Chocolate', receta, tachos });
const dulceDeLeche = (tachos: number): Renglon =>
  ({ saborId: 'dulce-de-leche', sabor: 'Dulce de Leche', receta: 'Familiar', tachos });
const frutillaCrema = (tachos: number): Renglon =>
  ({ saborId: 'frutilla-crema', sabor: 'Frutilla a la crema', receta: 'Familiar', tachos });
const menta = (tachos: number): Renglon =>
  ({ saborId: 'menta', sabor: 'Menta', receta: 'Familiar', tachos });

describe('calcular cotización', () => {
  it('Terminal con tres sabores y dos envases comprados cobra $352.000', () => {
    const c = calcularCotizacion({
      lista: listaTerminal,
      precioEnvase: PRECIO_ENVASE,
      renglones: [chocolate(3), dulceDeLeche(2), frutillaCrema(1)],
      compraEnvases: true,
      envasesComprados: 2,
    });
    expect(c.total).toBe(352000);
    expect(c.tachos).toBe(6);
    expect(c.envasesComprados).toBe(2);
    expect(c.envasesPrestados).toBe(4);
    expect(c.totalEnvases).toBe(10000);
    expect(c.esParcial).toBe(false);
  });

  it('Lista general con un renglón Artesanal y dos envases comprados cobra $293.000', () => {
    const c = calcularCotizacion({
      lista: listaGeneral,
      precioEnvase: PRECIO_ENVASE,
      renglones: [chocolate(3), dulceDeLeche(2), frutillaCrema(1), chocolate(1, 'Artesanal')],
      compraEnvases: true,
      envasesComprados: 2,
    });
    expect(c.total).toBe(293000);
    expect(c.tachos).toBe(7);
    expect(c.envasesPrestados).toBe(5);
  });

  it('cada renglón trae su precio unitario y su subtotal', () => {
    const c = calcularCotizacion({
      lista: listaGeneral,
      precioEnvase: PRECIO_ENVASE,
      renglones: [chocolate(3, 'Artesanal')],
      compraEnvases: false,
      envasesComprados: 0,
    });
    expect(c.renglones).toEqual([
      { saborId: 'chocolate', sabor: 'Chocolate', receta: 'Artesanal', tachos: 3, estado: 'ok', precioUnitario: 48000, subtotal: 144000 },
    ]);
  });

  it('en Terminal un renglón Artesanal queda no disponible y fuera del total', () => {
    const c = calcularCotizacion({
      lista: listaTerminal,
      precioEnvase: PRECIO_ENVASE,
      renglones: [chocolate(1), chocolate(2, 'Artesanal')],
      compraEnvases: false,
      envasesComprados: 0,
    });
    expect(c.renglones[1]).toMatchObject({ estado: 'no-disponible', precioUnitario: null, subtotal: null });
    expect(c.total).toBe(58000);
    expect(c.esParcial).toBe(true);
  });

  it('en la Lista general Menta queda sin precio y fuera del total', () => {
    const c = calcularCotizacion({
      lista: listaGeneral,
      precioEnvase: PRECIO_ENVASE,
      renglones: [chocolate(1), menta(2)],
      compraEnvases: false,
      envasesComprados: 0,
    });
    expect(c.renglones[1]).toMatchObject({ estado: 'sin-precio', precioUnitario: null, subtotal: null });
    expect(c.total).toBe(40000);
    expect(c.esParcial).toBe(true);
  });

  it('los envases comprados nunca superan los tachos', () => {
    const c = calcularCotizacion({
      lista: listaTerminal,
      precioEnvase: PRECIO_ENVASE,
      renglones: [chocolate(2)],
      compraEnvases: true,
      envasesComprados: 5,
    });
    expect(c.envasesComprados).toBe(2);
    expect(c.envasesPrestados).toBe(0);
    expect(c.totalEnvases).toBe(10000);
  });

  it('si no compra envases, todos quedan prestados y no se cobra ninguno', () => {
    const c = calcularCotizacion({
      lista: listaTerminal,
      precioEnvase: PRECIO_ENVASE,
      renglones: [chocolate(3)],
      compraEnvases: false,
      envasesComprados: 3,
    });
    expect(c.envasesComprados).toBe(0);
    expect(c.envasesPrestados).toBe(3);
    expect(c.totalEnvases).toBe(0);
    expect(c.total).toBe(174000);
  });

  it('si todavía no respondió si compra envases, no se cobra ninguno', () => {
    const c = calcularCotizacion({
      lista: listaTerminal,
      precioEnvase: PRECIO_ENVASE,
      renglones: [chocolate(1)],
      compraEnvases: null,
      envasesComprados: 1,
    });
    expect(c.envasesComprados).toBe(0);
    expect(c.total).toBe(58000);
  });

  it('una cotización vacía da todo en cero', () => {
    const c = calcularCotizacion({
      lista: listaGeneral,
      precioEnvase: PRECIO_ENVASE,
      renglones: [],
      compraEnvases: true,
      envasesComprados: 2,
    });
    expect(c).toMatchObject({ tachos: 0, envasesComprados: 0, envasesPrestados: 0, total: 0, esParcial: false });
  });
});

describe('texto para WhatsApp', () => {
  it('tiene la heladería y el total en negrita, el cliente, la fecha, los renglones y los envases a devolver', () => {
    const c = calcularCotizacion({
      lista: listaTerminal,
      precioEnvase: PRECIO_ENVASE,
      renglones: [chocolate(3), dulceDeLeche(2), frutillaCrema(1)],
      compraEnvases: true,
      envasesComprados: 2,
    });
    const texto = textoWhatsApp(c, { heladeria: 'Heladería Kokino', cliente: 'Terminal', fecha: new Date(2026, 3, 5) });
    expect(texto).toBe([
      '*Heladería Kokino*',
      'Cotización para: Terminal',
      'Fecha: 05/04/2026',
      '',
      '3 × Chocolate (Familiar): $174.000',
      '2 × Dulce de Leche (Familiar): $116.000',
      '1 × Frutilla a la crema (Familiar): $52.000',
      '2 × Envase: $10.000',
      '',
      '*Total: $352.000*',
      '',
      'Envases prestados a devolver: 4',
    ].join('\n'));
  });

  it('marca los renglones sin precio o no disponibles y omite envases cuando no hay', () => {
    const c = calcularCotizacion({
      lista: listaGeneral,
      precioEnvase: PRECIO_ENVASE,
      renglones: [menta(1)],
      compraEnvases: true,
      envasesComprados: 1,
    });
    const texto = textoWhatsApp(c, { heladeria: 'Heladería Kokino', cliente: 'Los Álamos', fecha: new Date(2026, 9, 21) });
    expect(texto).toBe([
      '*Heladería Kokino*',
      'Cotización para: Los Álamos',
      'Fecha: 21/10/2026',
      '',
      '1 × Menta (Familiar): precio a confirmar',
      '1 × Envase: $5.000',
      '',
      '*Total: $5.000*',
    ].join('\n'));
  });
});

describe('envases adeudados', () => {
  it('dos cotizaciones con 4 y 3 prestados y una devolución de 5 dan 2 adeudados', () => {
    expect(envasesAdeudados([{ envasesPrestados: 4 }, { envasesPrestados: 3 }], [{ cantidad: 5 }])).toBe(2);
  });

  it('sin cotizaciones ni devoluciones no adeuda nada', () => {
    expect(envasesAdeudados([], [])).toBe(0);
  });
});

describe('comparar nombres', () => {
  it('"maracuya" encuentra "Maracuyá"', () => {
    expect(coincide('maracuya', 'Maracuyá')).toBe(true);
  });

  it('encuentra un sabor escribiendo parte del nombre', () => {
    expect(coincide('dulce de', 'Dulce de leche con nuez')).toBe(true);
    expect(coincide('rocher', 'Chocolate')).toBe(false);
  });

  it('"  terminal " se reconoce como el cliente "Terminal"', () => {
    expect(normalizar('  terminal ')).toBe(normalizar('Terminal'));
  });

  it('ignora los espacios de más entre palabras', () => {
    expect(normalizar('Los   Álamos')).toBe(normalizar('los alamos'));
  });
});
