-- ADR 0004: los clientes cotizan con la Lista general menos su descuento; Terminal sigue con su lista especial.
-- Correr una sola vez en Supabase, sobre la base creada con esquema.sql (ADR 0003):
-- SQL Editor -> New query -> pegar todo -> Run. Si algo falla, no cambia nada.
--
-- No se pierden precios: las listas que antes se copiaban para cada cliente quedan guardadas,
-- aunque el sistema ya no las usa. Para ver si alguna tenía precios distintos de la Lista general:
--   select l.nombre, s.nombre as sabor, p.receta, p.precio, b.precio as precio_general
--   from precios p
--   join listas_precios l on l.id = p.lista_id and not l.es_base and l.nombre <> 'Lista Terminal'
--   join sabores s on s.id = p.sabor_id
--   left join precios b on b.sabor_id = p.sabor_id and b.receta = p.receta
--     and b.lista_id = (select id from listas_precios where es_base)
--   where b.precio is distinct from p.precio
--   order by l.nombre, s.nombre;

begin;

-- Las recetas que lleva cada cliente estaban en su lista propia: pasan al cliente.
alter table clientes add column recetas text[];
update clientes c set recetas = l.recetas from listas_precios l where l.id = c.lista_id;
alter table clientes alter column recetas set not null;
alter table clientes add constraint clientes_recetas_validas
  check (cardinality(recetas) > 0 and recetas <@ array['Familiar', 'Artesanal']);

-- Descuento habitual en porcentaje, sobre el precio de lista del helado.
alter table clientes add column descuento int not null default 0 check (descuento between 0 and 100);

-- Varios clientes comparten la Lista general: la lista deja de ser una por cliente.
alter table clientes drop constraint if exists clientes_lista_id_key;
update clientes set lista_id = (select id from listas_precios where es_base)
  where nombre_normalizado <> 'terminal';

-- Ya no se copia una lista al crear un cliente.
drop function if exists crear_cliente(text, text, text[]);

commit;
