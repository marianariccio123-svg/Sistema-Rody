-- Mudanza a otro proyecto de Supabase, paso 1 de 2: correr en el proyecto VIEJO (SQL Editor -> New query -> Run).
-- No cambia nada: devuelve una sola celda, "script", con todos los datos del sistema.
-- Paso 2: copiar el contenido completo de esa celda y correrlo en el SQL Editor del proyecto NUEVO,
-- que ya tiene que tener las tablas creadas con supabase/esquema.sql.
-- Se conservan los ids, así cada dispositivo sigue recordando el último cliente elegido.
with lineas (orden, linea) as (
            select 0, '-- Datos copiados del proyecto viejo el ' || to_char(now(), 'DD/MM/YYYY HH24:MI') || ' (UTC)'
  union all select 1, 'begin;'
  -- Saca los datos iniciales que cargó esquema.sql, para que queden exactamente los del proyecto viejo.
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
