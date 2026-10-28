-- Esquema de Sistema Rody (ADR 0003): cada cliente tiene su lista de precios, y los dueños editan precios y sabores.
-- Correr una sola vez en Supabase: SQL Editor -> New query -> pegar todo -> Run.
-- Reemplaza la tabla "precios" del prototipo.

drop table if exists precios;

create table sabores (
  id     uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  orden  int  not null           -- orden en que se muestran
);

-- La lista base (Lista general) es la que se copia al crear un cliente.
create table listas_precios (
  id      uuid    primary key default gen_random_uuid(),
  nombre  text    not null,
  recetas text[]  not null check (cardinality(recetas) > 0 and recetas <@ array['Familiar', 'Artesanal']),
  es_base boolean not null default false
);
create unique index una_sola_lista_base on listas_precios (es_base) where es_base;

-- Si falta la fila, el sabor no tiene precio en esa lista y receta. Montos en pesos enteros.
create table precios (
  lista_id uuid not null references listas_precios on delete cascade,
  sabor_id uuid not null references sabores on delete cascade,
  receta   text not null check (receta in ('Familiar', 'Artesanal')),
  precio   int  not null check (precio > 0),
  primary key (lista_id, sabor_id, receta)
);

create table clientes (
  id                 uuid primary key default gen_random_uuid(),
  nombre             text not null,
  nombre_normalizado text not null unique,   -- sin mayúsculas, acentos ni espacios de más: evita duplicados
  lista_id           uuid not null unique references listas_precios
);

create table ajustes (
  id            int primary key default 1 check (id = 1),
  precio_envase int not null check (precio_envase >= 0)
);

-- Solo un dueño con sesión iniciada puede leer o escribir. Sin sesión, las tablas se ven vacías.
alter table sabores        enable row level security;
alter table listas_precios enable row level security;
alter table precios        enable row level security;
alter table clientes       enable row level security;
alter table ajustes        enable row level security;
create policy "Dueños con sesión" on sabores        for all to authenticated using (true) with check (true);
create policy "Dueños con sesión" on listas_precios for all to authenticated using (true) with check (true);
create policy "Dueños con sesión" on precios        for all to authenticated using (true) with check (true);
create policy "Dueños con sesión" on clientes       for all to authenticated using (true) with check (true);
create policy "Dueños con sesión" on ajustes        for all to authenticated using (true) with check (true);
grant select, insert, update, delete on sabores, listas_precios, precios, clientes, ajustes to authenticated;

-- Crea un cliente con su propia lista, copiando de la lista base los precios de las recetas que lleva.
create function crear_cliente(p_nombre text, p_nombre_normalizado text, p_recetas text[])
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_lista   uuid;
  v_cliente uuid;
begin
  insert into listas_precios (nombre, recetas) values ('Lista ' || p_nombre, p_recetas) returning id into v_lista;
  insert into precios (lista_id, sabor_id, receta, precio)
    select v_lista, p.sabor_id, p.receta, p.precio
    from precios p join listas_precios l on l.id = p.lista_id
    where l.es_base and p.receta = any (p_recetas);
  insert into clientes (nombre, nombre_normalizado, lista_id)
    values (p_nombre, p_nombre_normalizado, v_lista) returning id into v_cliente;
  return v_cliente;
end;
$$;
revoke execute on function crear_cliente from public, anon;
grant execute on function crear_cliente to authenticated;

-- Datos iniciales: precios del Excel "Precios 22/04/26 Terminal" (provisorios hasta que lleguen las listas nuevas).
insert into ajustes (precio_envase) values (5000);

insert into sabores (nombre, orden) values
  ('Ananá', 1),
  ('Durazno', 2),
  ('Limón', 3),
  ('Frutilla al agua', 4),
  ('Ananá al Champagne', 5),
  ('Arándanos', 6),
  ('Vainilla', 7),
  ('Crema Americana', 8),
  ('Flan al Caramelo', 9),
  ('Granizado', 10),
  ('Banana Split', 11),
  ('Frutos del Bosque', 12),
  ('Frutilla a la crema', 13),
  ('Crema del Cielo', 14),
  ('Chocolate', 15),
  ('Dulce de Leche', 16),
  ('Dulce de leche granizado', 17),
  ('Chocolate blanco', 18),
  ('Dulce de leche goloso', 19),
  ('Mousse Limón', 20),
  ('Dulce de leche con nuez', 21),
  ('Menta', 22),
  ('Crema Rusa', 23),
  ('Tentación', 24),
  ('Kokino', 25),
  ('Maracuyá', 26),
  ('Coquicukis', 27),
  ('Almendrado', 28),
  ('Chocotorta', 29),
  ('Coco y dulce de leche', 30),
  ('Melón', 31),
  ('Crema Oriental', 32),
  ('Cerezas a la crema', 33),
  ('Kinotos al wiski', 34),
  ('Higos al coñac', 35),
  ('Chocolate a la cubana', 36),
  ('Chocolate con almendras', 37),
  ('Sambayón', 38),
  ('Rocher', 39),
  ('Amargo', 40);

insert into listas_precios (nombre, recetas, es_base) values
  ('Lista general',  array['Familiar', 'Artesanal'], true),
  ('Lista Terminal', array['Familiar'], false);

insert into clientes (nombre, nombre_normalizado, lista_id)
  select 'Terminal', 'terminal', id from listas_precios where nombre = 'Lista Terminal';

-- sabor, Lista Terminal (Familiar), Lista general Familiar, Lista general Artesanal; null = sin precio.
with tabla (sabor, terminal, familiar, artesanal) as (values
  ('Ananá',                     41000, 26000, 31200),
  ('Durazno',                   41000, 26000, 31200),
  ('Limón',                     41000, 26000, 31200),
  ('Frutilla al agua',          41000, 26000, 31200),
  ('Ananá al Champagne',        46000, 35000, 42000),
  ('Arándanos',                 46000, 35000, 42000),
  ('Vainilla',                  48000, 35000, 42000),
  ('Crema Americana',           48000, 35000, 42000),
  ('Flan al Caramelo',          52000, 35000, 42000),
  ('Granizado',                 52000, 35000, 42000),
  ('Banana Split',              52000, 35000, 42000),
  ('Frutos del Bosque',         52000, 35000, 42000),
  ('Frutilla a la crema',       52000, 35000, 42000),
  ('Crema del Cielo',           52000, 35000, 42000),
  ('Chocolate',                 58000, 40000, 48000),
  ('Dulce de Leche',            58000, 40000, 48000),
  ('Dulce de leche granizado',  60000, 40000, 48000),
  ('Chocolate blanco',          58000, 40000, 48000),
  ('Dulce de leche goloso',     60000,  null,  null),
  ('Mousse Limón',              60000, 40000, 48000),
  ('Dulce de leche con nuez',   60000, 48000, 57600),
  ('Menta',                     60000,  null,  null),
  ('Crema Rusa',                60000, 48000, 57600),
  ('Tentación',                 60000,  null,  null),
  ('Kokino',                    60000,  null,  null),
  ('Maracuyá',                  60000,  null,  null),
  ('Coquicukis',                60000,  null,  null),
  ('Almendrado',                60000, 48000, 57600),
  ('Chocotorta',                60000,  null,  null),
  ('Coco y dulce de leche',     60000, 48000, 57600),
  ('Melón',                     65000, 48000, 57600),
  ('Crema Oriental',            65000, 48000, 57600),
  ('Cerezas a la crema',        69000, 60000, 72000),
  ('Kinotos al wiski',          58000, 48000, 57600),
  ('Higos al coñac',            58000, 48000, 57600),
  ('Chocolate a la cubana',     58000, 48000, 57600),
  ('Chocolate con almendras',   65000, 48000, 57600),
  ('Sambayón',                  70000, 60000, 72000),
  ('Rocher',                    80000, 60000, 72000),
  ('Amargo',                    70000, 60000, 72000)
),
filas (lista, sabor, receta, precio) as (
            select 'Lista Terminal', sabor, 'Familiar',  terminal  from tabla
  union all select 'Lista general',  sabor, 'Familiar',  familiar  from tabla
  union all select 'Lista general',  sabor, 'Artesanal', artesanal from tabla
)
insert into precios (lista_id, sabor_id, receta, precio)
  select l.id, s.id, f.receta, f.precio::int
  from filas f
  join listas_precios l on l.nombre = f.lista
  join sabores s on s.nombre = f.sabor
  where f.precio is not null;
