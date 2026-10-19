# Cotizaciones de la heladería

Cómo la heladería calcula y registra lo que le cobra a cada mayorista por el helado que se lleva.

## Language

### Personas

**Mayorista**:
Comercio que le compra helado al por mayor a la heladería (por ejemplo, Terminal).
_Avoid_: cliente, cliente mayorista

**Vendedor**:
Persona de la heladería que arma las cotizaciones. Es el único que usa el sistema; el mayorista nunca lo ve.
_Avoid_: cliente, usuario

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

### Cotización

**Cotización**:
Detalle de los sabores y cantidades que se lleva un mayorista, con sus precios, sus envases comprados y el total. Conserva los precios del momento en que se hizo.
_Avoid_: presupuesto
