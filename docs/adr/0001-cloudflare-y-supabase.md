# Cloudflare para publicar y Supabase para datos y login

Los dueños usan el sistema desde el celular y la computadora y necesitan compartir clientes, cotizaciones y envases adeudados, con acceso solo para ellos. Decidimos publicar el frontend en Cloudflare y usar Supabase (PostgreSQL con login incluido) como base de datos y autenticación, sin administrar servidores propios: los planes gratuitos alcanzan para este volumen y nadie tiene que mantener infraestructura.

## Opciones consideradas

- **Vercel** para publicar: descartado porque su plan gratuito (Hobby) no permite uso comercial y el plan Pro tiene costo mensual por persona.
- **Servidor propio (VPS)**: descartado porque obliga a encargarse de actualizaciones, seguridad, copias de seguridad y caídas; es demasiado para un sistema chico mantenido por una sola persona.
- **Netlify**: alternativa válida a Cloudflare si algún día hiciera falta cambiar.

## Consecuencias

- El plan gratuito de Supabase pausa el proyecto después de una semana sin actividad, algo que puede pasar en invierno: hace falta una consulta automática diaria a la base de datos o pasar a un plan pago.
- El plan gratuito de Supabase no tiene copias de seguridad automáticas: hay que programar una exportación periódica del historial.
- Las cuentas de Cloudflare y Supabase se crean con un mail de la heladería, no uno personal, para que los datos sean del cliente.
- La llave secreta de Supabase nunca va en el código: el acceso se protege con reglas en la base de datos (solo un dueño con sesión iniciada puede leer o escribir).
