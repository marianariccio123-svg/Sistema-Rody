# Mudanza de la base de datos a una cuenta de Supabase de la heladería

Instrucciones para la IA que hace la mudanza. Seguilas en orden. En cada paso dice quién lo hace:

- **[IA]**: lo hacés vos.
- **[PERSONA]**: lo hace Mariana o un dueño. Frená, explicale qué tiene que hacer y esperá a que te confirme.

Si algo de lo que dice **Comprobar** no coincide, frená y avisá. No improvises ni sigas con el paso siguiente.

## Contexto

Sistema Rody es el sistema de cotizaciones de Heladería Kokino: una página en React publicada en Netlify, con los datos y el inicio de sesión en Supabase (ver `CLAUDE.md`, `CONTEXT.md` y los ADR de `docs/adr/`). El proyecto de Supabase está en la cuenta personal de Mariana y quedó **pausado** porque ella necesitaba lugar para otro proyecto: el plan gratuito permite 2 proyectos activos por cuenta. **Mientras esté pausado, el sistema no funciona para los dueños.**

Objetivo: pasar la base a un proyecto nuevo en una **cuenta de Supabase con un mail de la heladería**, como pide el ADR 0001 (los datos tienen que ser del cliente), y que el sistema publicado use el proyecto nuevo.

## Reglas

1. **No borres ni cambies datos del proyecto viejo.** Solo se lo reactiva un rato para exportar y se lo vuelve a pausar. Se borra recién al final, cuando la persona lo pida.
2. **Nunca uses la llave secreta** (empieza con `sb_secret_` o se llama `service_role`): no va en el código, en el chat ni en GitHub. En el código va solo la **llave publicable** (empieza con `sb_publishable_`).
3. **No inventes ni guardes contraseñas.** La contraseña de la base y las de los dueños las elige y anota la persona.
4. **Publicar:** cada push a la rama `claude/youthful-carson-jaomtm` publica en Netlify y gasta créditos. Hacé commits locales, corré `npm run probar` y **pusheá solo cuando la persona lo pida**, todo en un único push (ver `CLAUDE.md`).
5. Los scripts de este documento ya se probaron en una base PostgreSQL de prueba armada igual que la real: la copia quedó idéntica tabla por tabla. No los modifiques.

## Paso 1 [PERSONA]: cuenta de la heladería

1. Crear (o usar) un mail de la heladería, por ejemplo un Gmail de Heladería Kokino.
2. Con ese mail, crear una cuenta en **supabase.com** (Sign up) y confirmar el mail.
3. Opcional: desde la organización nueva (Organization settings → Team → Invite), invitar al mail de Mariana para que pueda manejarla desde su cuenta.

**Comprobar:** la persona puede entrar a supabase.com con la cuenta de la heladería.

## Paso 2 [PERSONA, con guía de la IA]: crear el proyecto nuevo

En la cuenta de la heladería: **New project**.

- **Name:** `sistema-rody`.
- **Database password:** que la persona genere una segura y **la guarde** en su gestor de contraseñas. No te la tiene que pasar.
- **Region:** **South America (São Paulo)**, la más cercana a Argentina. No se puede cambiar después.
- **Plan:** Free.

Esperar a que el proyecto termine de crearse (unos minutos).

**Comprobar:** el proyecto aparece activo en el panel.

## Paso 3 [IA o PERSONA]: crear las tablas en el proyecto nuevo

En el proyecto **nuevo**: **SQL Editor → New query**. Pegar el contenido **completo** de `supabase/esquema.sql`, que está en la rama `claude/youthful-carson-jaomtm` del repositorio, y tocar **Run**.

Si Supabase avisa que la consulta tiene operaciones destructivas, confirmar: el proyecto está vacío.

**Comprobar** con esta consulta en el proyecto nuevo:

```sql
select (select count(*) from sabores) as sabores, (select count(*) from listas_precios) as listas,
       (select count(*) from clientes) as clientes;
```

Tiene que dar `40 | 2 | 1`. Son los datos iniciales del Excel; en el paso 5 se reemplazan por los reales.

## Paso 4 [PERSONA, con guía de la IA]: exportar los datos del proyecto viejo

El proyecto viejo está en la **cuenta personal de Mariana**. Para exportar tiene que estar activo, y para reactivarlo hace falta un lugar libre entre sus 2 proyectos activos. Los proyectos pausados no cuentan.

1. **Hacer lugar:** si Mariana tiene 2 proyectos activos, pausar uno un rato (Project Settings → General → **Pause project**). Anotar cuál, para reactivarlo al final.
2. **Reactivar el proyecto de la cotización** (el que en la dirección tiene `jvmotivafwihuygzugdn`): abrirlo y tocar **Restore project**. Esperar a que esté activo; puede tardar varios minutos.
3. En ese proyecto: **SQL Editor → New query**. Pegar esto y tocar **Run** (es `supabase/mudanza/exportar-datos.sql`; solo lee, no cambia nada):

```sql
with lineas (orden, linea) as (
            select 0, '-- Datos copiados del proyecto viejo el ' || to_char(now(), 'DD/MM/YYYY HH24:MI') || ' (UTC)'
  union all select 1, 'begin;'
  union all select 2, 'truncate precios, clientes, listas_precios, sabores, ajustes;'
  union all select 3, format('insert into sabores (id, nombre, orden) values (%L, %L, %s);', id, nombre, orden)
              from sabores
  union all select 4, format('insert into listas_precios (id, nombre, recetas, es_base) values (%L, %L, %L, %L);', id, nombre, recetas, es_base)
              from listas_precios
  union all select 5, format('insert into precios (lista_id, sabor_id, receta, precio) values (%L, %L, %L, %s);', lista_id, sabor_id, receta, precio)
              from precios
  union all select 6, format('insert into clientes (id, nombre, nombre_normalizado, lista_id, recetas, descuento) values (%L, %L, %L, %L, %L, %s);',
                             id, nombre, nombre_normalizado, lista_id, recetas, descuento)
              from clientes
  union all select 7, format('insert into ajustes (id, precio_envase) values (%s, %s);', id, precio_envase)
              from ajustes
  union all select 8, 'commit;'
)
select string_agg(linea, E'\n' order by orden, linea) as script from lineas;
```

4. El resultado es **una sola celda** llamada `script`. Copiar su contenido **completo**: abrir la celda para ver el texto entero y copiarlo desde ahí. Guardarlo en un archivo de texto, por ejemplo `datos-viejos.sql`. Tiene que empezar con `-- Datos copiados del proyecto viejo` y terminar con `commit;`.
5. En el mismo proyecto viejo, correr la consulta de comparación (es `supabase/mudanza/comparar.sql`) y **anotar o capturar el resultado**:

```sql
select
  (select count(*) from sabores)        as sabores,
  (select count(*) from listas_precios) as listas,
  (select count(*) from precios)        as precios,
  (select sum(precio) from precios)     as suma_de_precios,
  (select precio_envase from ajustes)   as precio_envase,
  (select string_agg(nombre || ' ' || descuento || '%', ', ' order by nombre) from clientes) as clientes_y_descuentos;
```

6. Revisar también, en el proyecto viejo, **Authentication → Users**: anotar los **mails de los dueños** que tienen cuenta. Las contraseñas no se pueden copiar.
7. **Volver a pausar** el proyecto viejo y **reactivar** el otro proyecto de Mariana, si se pausó en el punto 1.

**Comprobar:** el archivo empieza con `-- Datos copiados del proyecto viejo` y termina con `commit;`, y el resultado de la comparación quedó anotado.

**Si no se puede copiar la celda entera** (por ejemplo, porque se ve cortada): exportar cada tabla desde **Table Editor → (tabla) → Export → CSV** (`sabores`, `listas_precios`, `precios`, `clientes`, `ajustes`) y avisarle a la persona antes de seguir, para cargarlas en el proyecto nuevo en ese mismo orden.

## Paso 5 [IA o PERSONA]: copiar los datos al proyecto nuevo

En el proyecto **nuevo**: **SQL Editor → New query**. Pegar el contenido completo de `datos-viejos.sql` y tocar **Run**.

- Si Supabase avisa por el `truncate`, confirmar: borra solo los datos iniciales del paso 3.
- Si da un error, no cambia nada, porque todo está entre `begin` y `commit`. Frená y mostrale el error a la persona.

**Comprobar:** correr la consulta de comparación del paso 4.5 en el proyecto **nuevo**. El resultado tiene que ser **idéntico** al del proyecto viejo.

## Paso 6 [PERSONA, con guía de la IA]: acceso de los dueños en el proyecto nuevo

En el proyecto **nuevo**:

1. **Authentication → Sign In / Providers:** desactivar **Allow new users to sign up**. Los dueños no se registran solos (ADR 0001).
2. **Authentication → Users → Add user → Create new user**, una vez por cada dueño anotado en el paso 4.6: su mail, una contraseña que elige el dueño o la persona (no la IA) y **Auto Confirm User** activado.
3. **Authentication → URL Configuration:** en **Site URL** y en **Redirect URLs**, cargar la dirección del sistema en Netlify, que figura en el panel de Netlify. Hace falta para que funcione el link para recuperar la contraseña.
4. Si en el proyecto viejo había un mail propio configurado (Authentication → Emails → SMTP Settings), cargarlo igual en el nuevo. La contraseña de ese mail la pone la persona.

**Comprobar:** en Authentication → Users están todos los dueños, y el registro libre está desactivado.

## Paso 7 [IA]: apuntar el sistema al proyecto nuevo

1. La persona te pasa, del proyecto nuevo:
   - la **Project URL** (`https://<algo>.supabase.co`), que está en Project Settings → Data API o en el botón **Connect**;
   - la **llave publicable** (`sb_publishable_...`), que está en Project Settings → API Keys.

   Las dos son públicas por diseño y pueden ir en el código. **Si te pasan una que empieza con `sb_secret_`, no la uses y pedí la publicable.**
2. Reemplazar la dirección y la llave viejas por las nuevas en:
   - `src/datos/supabase.ts` (`SUPABASE_URL` y `SUPABASE_KEY`);
   - `.github/workflows/supabase-activo.yml` (la dirección del `curl` y el encabezado `apikey`).

   No toques `prototype/`: es el prototipo viejo y no se publica.
3. En `docs/adr/0001-netlify-y-supabase.md`, cambiar la consecuencia que dice "El proyecto de Supabase quedó en la región East US (Ohio)…" por: el proyecto está en la cuenta de Supabase de la heladería, en la región South America (São Paulo), desde la fecha de hoy, y cambiar de región obliga a crear un proyecto nuevo.
4. Buscar que no quede ninguna referencia al proyecto viejo fuera de `prototype/`: `grep -rn jvmotivafwihuygzugdn --exclude-dir=node_modules --exclude-dir=prototype .`, que no tiene que devolver nada.
5. Commit local con un mensaje claro, por ejemplo "Mudar la base a la cuenta de Supabase de la heladería".
6. Correr `npm run probar`: pruebas, tipos, build y la versión construida en `http://localhost:4173`. Pedile a la persona que entre ahí con la cuenta de un dueño.

**Comprobar** con la persona en `localhost:4173`:
- se entra con la cuenta de un dueño;
- aparecen los clientes con sus descuentos, iguales a los del proyecto viejo;
- en "Precios, sabores y clientes" se ven los precios de la Lista general y de la Lista Terminal;
- una cotización de prueba calcula bien.

**No guardes ninguna cotización de prueba ni cambies precios** salvo que la persona lo pida: es la base real.

## Paso 8 [IA, cuando la persona lo pida]: publicar

1. `git push` de la rama `claude/youthful-carson-jaomtm`, en un solo push. Gasta créditos de Netlify.
2. Esperar a que Netlify publique (1 o 2 minutos).
3. En GitHub → pestaña **Actions** → **Mantener Supabase activo** → **Run workflow**, para comprobar que la consulta diaria llega al proyecto nuevo.

**Comprobar** con la persona:
- el sistema publicado funciona con la cuenta de un dueño, desde la computadora y desde el celular. En el celular, cerrar del todo y volver a abrir;
- la tarea "Mantener Supabase activo" terminó en verde.

## Paso 9 [PERSONA]: después de unos días

- Si todo anduvo bien durante unos días, Mariana puede **borrar el proyecto viejo** de su cuenta (Project Settings → General → Delete project). Mientras siga pausado no ocupa lugar en su límite, y sirve para volver atrás si algo sale mal.
- **Para volver atrás** (solo antes de borrarlo): reactivar el proyecto viejo y revertir el commit del paso 7.
- Los proyectos gratis pausados se pueden reactivar durante 90 días; después, Supabase solo ofrece descargar una copia. Conviene terminar la mudanza bastante antes de ese plazo.
