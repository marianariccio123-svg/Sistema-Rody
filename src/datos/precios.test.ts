import { describe, expect, it } from 'vitest';
import { calcularCotizacion, type Receta } from '../cotizador/cotizador';
import { LISTAS, PRECIO_ENVASE, SABORES } from './precios';

const renglon = (nombre: string, tachos: number, receta: Receta = 'Familiar') => {
  const sabor = SABORES.find((s) => s.nombre === nombre)!;
  return { saborId: sabor.id, sabor: sabor.nombre, receta, tachos };
};

describe('precios cargados', () => {
  it('hay 40 sabores, sin repetidos', () => {
    expect(SABORES).toHaveLength(40);
    expect(new Set(SABORES.map((s) => s.id)).size).toBe(40);
  });

  it('con la Lista Terminal el ejemplo de la spec da $352.000', () => {
    const c = calcularCotizacion({
      lista: LISTAS.terminal, precioEnvase: PRECIO_ENVASE, compraEnvases: true, envasesComprados: 2,
      renglones: [renglon('Chocolate', 3), renglon('Dulce de Leche', 2), renglon('Frutilla a la crema', 1)],
    });
    expect(c.total).toBe(352000);
  });

  it('con la Lista general el ejemplo de la spec da $293.000', () => {
    const c = calcularCotizacion({
      lista: LISTAS.general, precioEnvase: PRECIO_ENVASE, compraEnvases: true, envasesComprados: 2,
      renglones: [renglon('Chocolate', 3), renglon('Dulce de Leche', 2), renglon('Frutilla a la crema', 1), renglon('Chocolate', 1, 'Artesanal')],
    });
    expect(c.total).toBe(293000);
  });

  it('en la Lista general siete sabores quedan sin precio', () => {
    const conPrecio = new Set(LISTAS.general.precios.map((p) => p.saborId));
    expect(SABORES.filter((s) => !conPrecio.has(s.id)).map((s) => s.nombre)).toEqual(
      ['Dulce de leche goloso', 'Menta', 'Tentación', 'Kokino', 'Maracuyá', 'Coquicukis', 'Chocotorta']);
  });
});
