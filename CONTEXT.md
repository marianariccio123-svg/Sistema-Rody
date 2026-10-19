# Cotizaciones de la heladería

Cómo la heladería calcula y registra lo que le cobra a cada cliente por el helado en tacho que se lleva.

## Language

### Personas

**Dueño**:
Cada uno de los dueños de la heladería. Son los únicos que usan el sistema: ni los empleados ni los clientes lo ven.
_Avoid_: vendedor, empleado, usuario

**Cliente**:
Persona o comercio al que la heladería le vende helado por tacho y le hace una cotización.
_Avoid_: mayorista, comprador

**Cliente fijo**:
Cliente al que, por su antigüedad, la heladería le cotiza con una lista de precios especial en lugar de la Lista general (por ejemplo, Terminal).
_Avoid_: mayorista, cliente con antigüedad

### Helado

**Sabor**:
Cada variedad de helado que fabrica la heladería (por ejemplo, Ananá, Chocolate, Rocher).
_Avoid_: gusto, producto

**Receta**:
Forma de elaborar un sabor: Familiar o Artesanal. Un mismo sabor tiene un precio distinto según su receta.
_Avoid_: calidad, tipo, línea

**Envase**:
Recipiente en el que se entrega el helado. Cada envase es **comprado** (el cliente lo paga y se lo queda) o **prestado** (no lo paga y lo devuelve después).
_Avoid_: sin envase, con envase

**Envases adeudados**:
Cantidad de envases prestados que un cliente todavía no le devolvió a la heladería.
_Avoid_: deuda, saldo

### Precios

**Lista de precios**:
Precio de cada sabor y receta con el que se cotiza. Cada cliente fijo cotiza con una lista especial; los demás clientes, con la Lista general.
_Avoid_: hoja de precios, tarifa

**Lista general**:
Lista de precios para cualquier cliente que no es fijo.
_Avoid_: precio mayorista

### Cotización

**Cotización**:
Detalle de los sabores y cantidades que se lleva un cliente, con los precios de su lista de precios, sus envases comprados y el total. Se corrige hasta que refleja lo que el cliente realmente se llevó, y conserva los precios del momento en que se hizo.
_Avoid_: presupuesto, pedido
