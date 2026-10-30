# Cotizaciones de la heladería

Cómo Heladería Kokino calcula y registra lo que le cobra a cada cliente por el helado en tacho que se lleva.

## Language

### Personas

**Dueño**:
Cada uno de los dueños de la heladería. Son los únicos que usan el sistema: ni los empleados ni los clientes lo ven.
_Avoid_: vendedor, empleado, usuario

**Cliente**:
Persona o comercio, cargado por los dueños con su nombre, al que la heladería le vende helado por tacho y le hace una cotización.
_Avoid_: mayorista, comprador

### Helado

**Sabor**:
Cada variedad de helado que fabrica la heladería (por ejemplo, Ananá, Chocolate, Rocher). Cualquier cliente puede llevar cualquier sabor.
_Avoid_: gusto, producto

**Receta**:
Forma de elaborar un sabor: Familiar o Artesanal. Cada una tiene su propio precio, y cada cliente lleva solo las recetas que tiene elegidas (Terminal, solo Familiar).
_Avoid_: calidad, tipo, línea

**Envase**:
Recipiente en el que se entrega el helado. Cada envase es **comprado** (el cliente lo paga y se lo queda) o **prestado** (no lo paga y lo devuelve después).
_Avoid_: sin envase, con envase

**Envases adeudados**:
Cantidad de envases prestados que un cliente todavía no le devolvió a la heladería.
_Avoid_: deuda, saldo

**Devolución de envases**:
Registro de cuántos envases prestados le devolvió un cliente a la heladería en un día; descuenta de sus envases adeudados. Un cliente puede devolverlos de a partes.
_Avoid_: reintegro, retorno

### Precios

**Lista de precios**:
Precio de cada sabor en las recetas que incluye. Hay una Lista general y listas especiales; los dueños las editan desde el sistema. Si a un sabor le falta el precio en una lista, no se puede cotizar con esa lista.
_Avoid_: hoja de precios, tarifa

**Lista general**:
Lista de precios que comparten todos los clientes que no tienen una lista especial; cada uno paga estos precios menos su descuento. Un aumento en la Lista general les llega a todos.
_Avoid_: precio mayorista, lista por defecto, lista base

**Lista especial**:
Lista de precios propia de un cliente cuyos precios no son la Lista general con un descuento (por ejemplo, la de Terminal, que solo tiene Familiar).
_Avoid_: lista del cliente, lista copiada

**Descuento**:
Porcentaje que se le resta al precio de lista del helado de un cliente. Cada cliente tiene un descuento habitual que se puede cambiar en cada cotización; no se aplica a los envases, y el cliente solo ve los precios ya descontados.
_Avoid_: bonificación, rebaja

### Cotización

**Cotización**:
Detalle de los sabores y cantidades que se lleva un cliente, con los precios de su lista de precios menos su descuento, sus envases comprados y el total. Se guarda cuando el cliente se lleva el helado, se corrige hasta que refleja lo que realmente se llevó, y conserva los precios del momento en que se hizo.
_Avoid_: presupuesto, pedido
