// Cotizador: todas las reglas de negocio de las cotizaciones, sin pantallas ni base de datos.
// El vocabulario (receta, lista de precios, envases prestados…) está definido en CONTEXT.md.

export type Receta = 'Familiar' | 'Artesanal';
export type EstadoRenglon = 'ok' | 'sin-precio' | 'no-disponible';

export type PrecioEnLista = { saborId: string; receta: Receta; precio: number };

// Si un sabor no tiene fila para una receta de la lista, no tiene precio en esa lista.
export type ListaPrecios = { nombre: string; recetas: Receta[]; precios: PrecioEnLista[] };

export type Renglon = { saborId: string; sabor: string; receta: Receta; tachos: number };

// precioLista es el de la lista de precios; precioUnitario, el que paga el cliente después del descuento.
export type RenglonCalculado = Renglon & {
  estado: EstadoRenglon;
  precioLista: number | null;
  precioUnitario: number | null;
  subtotal: number | null;
};

export type CotizacionCalculada = {
  renglones: RenglonCalculado[];
  tachos: number;
  envasesComprados: number;
  envasesPrestados: number;
  totalEnvases: number;
  descuento: number;         // porcentaje aplicado
  montoDescuento: number;    // cuánto se le descontó al helado; solo lo ve el dueño
  total: number;
  esParcial: boolean;
};

export type DatosCotizacion = {
  lista: ListaPrecios;
  precioEnvase: number;
  renglones: Renglon[];
  compraEnvases: boolean | null;   // null = todavía sin responder
  envasesComprados: number;
  descuento?: number;              // porcentaje sobre el helado; sin descuento = 0
};

export function calcularCotizacion(d: DatosCotizacion): CotizacionCalculada {
  const descuento = Math.max(0, Math.min(100, d.descuento ?? 0));
  const renglones = d.renglones.map((r) => calcularRenglon(d.lista, r, descuento));
  const tachos = renglones.reduce((suma, r) => suma + r.tachos, 0);
  // Supone 1 envase por tacho.
  const envasesComprados = d.compraEnvases ? Math.max(0, Math.min(d.envasesComprados, tachos)) : 0;
  const totalEnvases = envasesComprados * d.precioEnvase;
  const totalHelado = renglones.reduce((suma, r) => suma + (r.subtotal ?? 0), 0);
  const totalHeladoLista = renglones.reduce((suma, r) => suma + (r.precioLista ?? 0) * r.tachos, 0);
  return {
    renglones,
    tachos,
    envasesComprados,
    envasesPrestados: tachos - envasesComprados,
    totalEnvases,
    descuento,
    montoDescuento: totalHeladoLista - totalHelado,
    total: totalHelado + totalEnvases,
    esParcial: renglones.some((r) => r.estado !== 'ok'),
  };
}

// El descuento se aplica a cada precio unitario y se redondea al peso: así cada renglón del mensaje ya muestra
// su precio final y la suma cierra, sin que se note el descuento. Se calcula con enteros para no arrastrar
// errores de los decimales (41.250 con 3% da 40.012,5 y se redondea a 40.013).
const conDescuento = (precio: number, descuento: number) => Math.round(precio * (100 - descuento) / 100);

function calcularRenglon(lista: ListaPrecios, r: Renglon, descuento: number): RenglonCalculado {
  if (!lista.recetas.includes(r.receta)) {
    return { ...r, estado: 'no-disponible', precioLista: null, precioUnitario: null, subtotal: null };
  }
  const fila = lista.precios.find((p) => p.saborId === r.saborId && p.receta === r.receta);
  if (!fila) return { ...r, estado: 'sin-precio', precioLista: null, precioUnitario: null, subtotal: null };
  const precioUnitario = conDescuento(fila.precio, descuento);
  return { ...r, estado: 'ok', precioLista: fila.precio, precioUnitario, subtotal: precioUnitario * r.tachos };
}

// Precio que paga el cliente por un tacho de ese sabor y receta, o null si su lista no lo tiene.
export function precioConDescuento(lista: ListaPrecios, saborId: string, receta: Receta, descuento = 0) {
  if (!lista.recetas.includes(receta)) return null;
  const fila = lista.precios.find((p) => p.saborId === saborId && p.receta === receta);
  return fila ? conDescuento(fila.precio, Math.max(0, Math.min(100, descuento))) : null;
}

const pesos = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

// Montos en pesos enteros: $41.000.
export const formatearPesos = (monto: number) => '$' + pesos.format(monto);

// Fechas dd/mm/aaaa.
export function formatearFecha(fecha: Date) {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${dos(fecha.getDate())}/${dos(fecha.getMonth() + 1)}/${fecha.getFullYear()}`;
}

// Texto para WhatsApp: los asteriscos se ven en negrita.
export function textoWhatsApp(c: CotizacionCalculada, o: { heladeria: string; cliente: string; fecha: Date }) {
  const lineas = [`*${o.heladeria}*`, `Cotización para: ${o.cliente}`, `Fecha: ${formatearFecha(o.fecha)}`, ''];
  for (const r of c.renglones) {
    const importe = r.subtotal != null ? formatearPesos(r.subtotal) : r.estado === 'sin-precio' ? 'precio a confirmar' : 'no disponible';
    lineas.push(`${r.tachos} × ${r.sabor} (${r.receta}): ${importe}`);
  }
  if (c.envasesComprados) lineas.push(`${c.envasesComprados} × Envase: ${formatearPesos(c.totalEnvases)}`);
  lineas.push('', `*Total: ${formatearPesos(c.total)}*`);
  if (c.envasesPrestados) lineas.push('', `Envases prestados a devolver: ${c.envasesPrestados}`);
  return lineas.join('\n');
}

// Envases prestados en las cotizaciones guardadas de un cliente, menos lo que ya devolvió.
export function envasesAdeudados(cotizaciones: { envasesPrestados: number }[], devoluciones: { cantidad: number }[]) {
  const prestados = cotizaciones.reduce((suma, c) => suma + c.envasesPrestados, 0);
  const devueltos = devoluciones.reduce((suma, d) => suma + d.cantidad, 0);
  return prestados - devueltos;
}

// Sin mayúsculas, acentos ni espacios de más: para buscar sabores y detectar clientes duplicados.
export const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');

export const coincide = (busqueda: string, nombre: string) => normalizar(nombre).includes(normalizar(busqueda));
