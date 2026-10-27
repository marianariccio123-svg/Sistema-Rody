import type { ListaId } from './precios';

export type Cliente = { id: string; nombre: string; listaId: ListaId; fijo: boolean };

// Terminal es el único cliente fijo; los que se agregan cotizan con la Lista general.
export const TERMINAL: Cliente = { id: 'terminal', nombre: 'Terminal', listaId: 'terminal', fijo: true };

// Sin base de datos (ADR 0002): los clientes agregados quedan guardados solo en este navegador.
const CLAVE = 'sistema-rody:clientes';

export function leerClientes(): Cliente[] {
  try {
    const guardados = JSON.parse(localStorage.getItem(CLAVE) ?? '[]') as Cliente[];
    return [TERMINAL, ...guardados.filter((c) => c.id !== TERMINAL.id)];
  } catch {
    return [TERMINAL];
  }
}

export function guardarClientes(clientes: Cliente[]) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(clientes.filter((c) => c.id !== TERMINAL.id)));
  } catch {
    // Navegador sin almacenamiento (modo privado): el cliente sirve para esta cotización y se pierde al cerrar.
  }
}
