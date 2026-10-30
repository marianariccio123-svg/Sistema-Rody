# Una lista de precios por cliente, editable y guardada en Supabase

_Reemplazado en parte por el ADR 0004: los clientes ya no tienen una lista copiada, sino la Lista general con su descuento. Sigue valiendo que los precios viven en Supabase y se editan desde el sistema._

Cada cliente mayorista paga un precio distinto, y los dueños quieren cambiar precios y agregar sabores desde el sistema. Esos cambios tienen que verse en todos los dispositivos de los dos dueños y no perderse, así que se retoma Supabase como base de datos con inicio de sesión (ADR 0001), y deja de valer el ADR 0002.

Cada cliente tiene su propia lista de precios. Al agregarlo, se eligen las recetas que lleva y su lista arranca como copia de la Lista general para esas recetas; después se le cambian los precios que sean distintos. La Lista general queda como base para los clientes nuevos, no como la lista de "cualquier cliente".

## Consecuencias

- Los precios ya no están en el código: viven en `supabase/esquema.sql` (los iniciales) y en la base. Un aumento se hace desde la pantalla "Precios y sabores", sin publicar.
- Copiar en lugar de compartir la Lista general significa que un aumento en la Lista general no llega a los clientes ya cargados: hay que cambiarlo en cada lista. Se eligió así porque cada mayorista tiene su precio.
- Los clientes que la versión sin base de datos había guardado en cada navegador se pasan a la base, con la Lista general, la primera vez que se inicia sesión desde ese dispositivo.
- Vuelven a valer los pendientes de operación del ADR 0001: la consulta diaria para que Supabase no pause el proyecto, las copias de seguridad, el mail propio para recuperar la contraseña y las cuentas de los dueños.
