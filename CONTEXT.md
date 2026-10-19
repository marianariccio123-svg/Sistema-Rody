# Cotizaciones de la heladería

Cómo la heladería calcula y registra lo que le cobra a cada mayorista por el helado que se lleva.

## Language

### Personas

**Mayorista**:
Comercio que le compra helado al por mayor a la heladería (por ejemplo, Terminal).
_Avoid_: cliente, cliente mayorista

**Dueño**:
Cada uno de los dueños de la heladería. Son los únicos que usan el sistema: ni los empleados ni los mayoristas lo ven.
_Avoid_: vendedor, empleado, cliente, usuario

### Helado

**Sabor**:
Cada variedad de helado que fabrica la heladería (por ejemplo, Ananá, Chocolate, Rocher).
_Avoid_: gusto, producto

**Receta**:
Forma de elaborar un sabor: Familiar o Artesanal. Un mismo sabor tiene un precio distinto según su receta.
_Avoid_: calidad, tipo, línea

**Envase**:
Recipiente en el que se entrega el helado. Cada envase es **comprado** (el mayorista lo paga y se lo queda) o **prestado** (no lo paga y lo devuelve después).
_Avoid_: sin envase, con envase

**Envases adeudados**:
Cantidad de envases prestados que un mayorista todavía no le devolvió a la heladería.
_Avoid_: deuda, saldo

### Cotización

**Cotización**:
Detalle de los sabores y cantidades que se lleva un mayorista, con sus precios, sus envases comprados y el total. Se corrige hasta que refleja lo que el mayorista realmente se llevó, y conserva los precios del momento en que se hizo.
_Avoid_: presupuesto, pedido
