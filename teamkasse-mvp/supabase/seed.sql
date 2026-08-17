-- Beispielseed fuer Tests im Supabase SQL Editor.
-- Auth-User-IDs muessen durch echte IDs aus auth.users ersetzt werden.

insert into public.teams (id, name, bank_account_holder, bank_iban, bank_bic)
values (
  '11111111-1111-1111-1111-111111111111',
  'FC Beispiel',
  'FC Beispiel Mannschaftskasse',
  'DE02120300000000202051',
  'BYLADEM1001'
)
on conflict (id) do nothing;

insert into public.team_members (id, team_id, user_id, display_name, jersey_number, role)
values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', null, 'Max Kassenwart', 1, 'admin'),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', null, 'Timo Stuermer', 9, 'player'),
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', null, 'Leon Abwehr', 4, 'player')
on conflict (id) do nothing;

insert into public.catalog_items (team_id, type, name, description, amount_cents)
values
  ('11111111-1111-1111-1111-111111111111', 'fine', 'Zu spaet zum Training', 'Bis 15 Minuten', 500),
  ('11111111-1111-1111-1111-111111111111', 'fine', 'Material vergessen', 'Schuhe, Schienbeinschoner oder Leibchen', 300),
  ('11111111-1111-1111-1111-111111111111', 'drink', 'Bier', 'Flasche', 250),
  ('11111111-1111-1111-1111-111111111111', 'drink', 'Wasser', 'Flasche', 120)
on conflict do nothing;
