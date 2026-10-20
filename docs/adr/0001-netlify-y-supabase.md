# Netlify para publicar y Supabase para datos y login

Los dueños usan el sistema desde el celular y la computadora y necesitan compartir clientes, cotizaciones y envases adeudados, con acceso solo para ellos. Decidimos publicar el frontend en Netlify, conectado al repositorio de GitHub para que cada cambio subido se publique solo, y usar Supabase (PostgreSQL con login incluido) como base de datos y autenticación, sin administrar servidores propios: los planes gratuitos alcanzan para este volumen y nadie tiene que mantener infraestructura.

Primero se había elegido Cloudflare para publicar; se cambió a Netlify porque el prototipo ya quedó publicado y funcionando ahí. Netlify publica la carpeta que indica `netlify.toml`.

## Opciones consideradas

- **Cloudflare** para publicar: alternativa válida a Netlify, con plan gratuito comparable, si algún día hiciera falta cambiar.
- **Vercel** para publicar: descartado porque su plan gratuito (Hobby) no permite uso comercial y el plan Pro tiene costo mensual por persona.
- **Servidor propio (VPS)**: descartado porque obliga a encargarse de actualizaciones, seguridad, copias de seguridad y caídas; es demasiado para un sistema chico mantenido por una sola persona.

## Consecuencias

- El plan gratuito de Supabase pausa el proyecto después de una semana sin actividad, algo que puede pasar en invierno: hace falta una consulta automática diaria a la base de datos o pasar a un plan pago.
- El plan gratuito de Supabase no tiene copias de seguridad automáticas: hay que programar una exportación periódica del historial.
- Las cuentas de Netlify y Supabase se crean con un mail de la heladería, no uno personal, para que los datos sean del cliente.
- La llave secreta de Supabase nunca va en el código: el acceso se protege con reglas en la base de datos (solo un dueño con sesión iniciada puede leer o escribir). La llave publicable sí va en la página.
- Los dueños no se registran solos: el registro libre está cerrado en Supabase y cada cuenta se crea a mano desde el panel.
- El mail que trae Supabase (para recuperar la contraseña) manda pocos mensajes por hora y solo a miembros del equipo de Supabase: para que les llegue a todos los dueños hay que configurar un servidor de mail propio (SMTP), por ejemplo el Gmail de la heladería.
- La dirección de la página en Netlify tiene que estar cargada en Supabase (Authentication → URL Configuration) para que el link del mail de recuperación vuelva al sistema.
- El proyecto de Supabase quedó en la región East US (Ohio); cambiar de región obliga a crear un proyecto nuevo.
