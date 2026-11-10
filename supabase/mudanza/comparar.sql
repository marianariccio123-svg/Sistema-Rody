-- Mudanza a otro proyecto de Supabase: correr en el proyecto VIEJO y en el NUEVO. Las dos filas tienen que ser iguales.
-- No cambia nada.
select
  (select count(*) from sabores)        as sabores,
  (select count(*) from listas_precios) as listas,
  (select count(*) from precios)        as precios,
  (select sum(precio) from precios)     as suma_de_precios,
  (select precio_envase from ajustes)   as precio_envase,
  (select string_agg(nombre || ' ' || descuento || '%', ', ' order by nombre) from clientes) as clientes_y_descuentos;
