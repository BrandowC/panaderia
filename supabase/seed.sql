/*
 * Panes iniciales sin foto: la propietaria las toma desde la aplicacion.
 * Idempotente: se puede ejecutar varias veces sin duplicar.
 */

insert into public.products (name, normalized_name, sort_order)
values
  ('Pan jirafa', '', 10),
  ('Pan holandés', '', 20),
  ('Cuca', '', 30),
  ('Chicharrona', '', 40),
  ('Caña', '', 50),
  ('Rollo', '', 60),
  ('Rosquita', '', 70),
  ('Pan de queso', '', 80),
  ('Almojábana', '', 90),
  ('Pandebono', '', 100),
  ('Croissant', '', 110),
  ('Pan de coco', '', 120),
  ('Pan aliñado', '', 130),
  ('Mogolla', '', 140),
  ('Pan blandito', '', 150)
on conflict do nothing;
