# Primera versión solo en Netlify, sin base de datos ni login

_Reemplazado por el ADR 0003._

Para que los dueños empiecen a usar el sistema ya, la primera versión es solo la pantalla de cotización publicada en Netlify, sin Supabase: no hay inicio de sesión, los precios están escritos en el código (`src/datos/precios.ts`) y los clientes que se agregan quedan guardados en el navegador de cada dispositivo. Reemplaza, por ahora, la parte de Supabase del ADR 0001; la parte de Netlify sigue igual.

## Consecuencias

- Cualquiera que tenga la dirección de la página puede abrirla y ver los precios. No es secreta, pero no está indexada ni publicada en ningún lado.
- Los clientes agregados no se comparten entre dispositivos ni entre los dueños, y se pierden si se borran los datos del navegador. Terminal siempre está.
- Un aumento de precios se hace cambiando `src/datos/precios.ts` y subiendo el cambio; Netlify lo publica solo.
- Todavía no se guardan cotizaciones, historial ni envases adeudados: eso necesita una base de datos compartida, y cuando haga falta se retoma Supabase como dice el ADR 0001.
