# Lista general con descuento por cliente, en lugar de una lista por cliente

_Reemplaza en parte al ADR 0003: la lista copiada para cada cliente._

Cuando a un cliente se le vende más barato, la diferencia es el mismo porcentaje en todos los sabores. Por eso, en lugar de copiar la Lista general para cada cliente y editarla sabor por sabor (ADR 0003), los clientes cotizan con la Lista general, que comparten, menos su descuento habitual. Los clientes cuyos precios no son un porcentaje de la Lista general, como Terminal, siguen con una lista especial. Así un aumento se carga una sola vez y les llega a todos.

## Consecuencias

- El descuento se aplica a cada precio unitario del helado, redondeado al peso, y no a los envases: la cotización y el mensaje muestran los precios finales sin mencionar el descuento, y la suma de los renglones da el total.
- El descuento habitual se guarda en el cliente y se puede cambiar o quitar en cada cotización.
- Las recetas que lleva cada cliente pasan de su lista al cliente.
- Las listas que se habían copiado para cada cliente quedan en la base sin usarse, para no perder precios. `supabase/migraciones/0004-descuento-por-cliente.sql` trae una consulta para ver si alguna tenía precios distintos de la Lista general.
- Eliminar un cliente borra solo el cliente, nunca su lista: la Lista general es de todos.
