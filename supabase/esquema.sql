-- Lista de precios del Excel "Precios 22/04/26 Terminal".
-- Correr una sola vez en Supabase: SQL Editor -> New query -> pegar todo -> Run.

create table precios (
  orden     int primary key,          -- orden en que se muestran los sabores
  sabor     text not null unique,
  terminal  int,                       -- Lista Terminal (solo Familiar)
  familiar  int,                       -- Lista general, receta Familiar; null = sin precio
  artesanal int                        -- Lista general, receta Artesanal; null = sin precio
);

-- Solo un dueño con sesión iniciada puede leer los precios. Sin sesión, la tabla se ve vacía.
alter table precios enable row level security;
create policy "Leen los dueños con sesión" on precios
  for select to authenticated using (true);

insert into precios (orden, sabor, terminal, familiar, artesanal) values
  (1, 'Ananá', 41000, 26000, 31200),
  (2, 'Durazno', 41000, 26000, 31200),
  (3, 'Limón', 41000, 26000, 31200),
  (4, 'Frutilla al agua', 41000, 26000, 31200),
  (5, 'Ananá al Champagne', 46000, 35000, 42000),
  (6, 'Arándanos', 46000, 35000, 42000),
  (7, 'Vainilla', 48000, 35000, 42000),
  (8, 'Crema Americana', 48000, 35000, 42000),
  (9, 'Flan al Caramelo', 52000, 35000, 42000),
  (10, 'Granizado', 52000, 35000, 42000),
  (11, 'Banana Split', 52000, 35000, 42000),
  (12, 'Frutos del Bosque', 52000, 35000, 42000),
  (13, 'Frutilla a la crema', 52000, 35000, 42000),
  (14, 'Crema del Cielo', 52000, 35000, 42000),
  (15, 'Chocolate', 58000, 40000, 48000),
  (16, 'Dulce de Leche', 58000, 40000, 48000),
  (17, 'Dulce de leche granizado', 60000, 40000, 48000),
  (18, 'Chocolate blanco', 58000, 40000, 48000),
  (19, 'Dulce de leche goloso', 60000, null, null),
  (20, 'Mousse Limón', 60000, 40000, 48000),
  (21, 'Dulce de leche con nuez', 60000, 48000, 57600),
  (22, 'Menta', 60000, null, null),
  (23, 'Crema Rusa', 60000, 48000, 57600),
  (24, 'Tentación', 60000, null, null),
  (25, 'Kokino', 60000, null, null),
  (26, 'Maracuyá', 60000, null, null),
  (27, 'Coquicukis', 60000, null, null),
  (28, 'Almendrado', 60000, 48000, 57600),
  (29, 'Chocotorta', 60000, null, null),
  (30, 'Coco y dulce de leche', 60000, 48000, 57600),
  (31, 'Melón', 65000, 48000, 57600),
  (32, 'Crema Oriental', 65000, 48000, 57600),
  (33, 'Cerezas a la crema', 69000, 60000, 72000),
  (34, 'Kinotos al wiski', 58000, 48000, 57600),
  (35, 'Higos al coñac', 58000, 48000, 57600),
  (36, 'Chocolate a la cubana', 58000, 48000, 57600),
  (37, 'Chocolate con almendras', 65000, 48000, 57600),
  (38, 'Sambayón', 70000, 60000, 72000),
  (39, 'Rocher', 80000, 60000, 72000),
  (40, 'Amargo', 70000, 60000, 72000);
