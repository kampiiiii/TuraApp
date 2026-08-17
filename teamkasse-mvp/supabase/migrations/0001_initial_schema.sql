create extension if not exists "pgcrypto";

create type public.app_role as enum ('admin', 'player');
create type public.catalog_type as enum ('fine', 'drink');
create type public.ledger_type as enum ('fine', 'drink', 'payment', 'adjustment');
create type public.ledger_status as enum ('open', 'paid', 'voided');

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency text not null default 'EUR',
  bank_account_holder text,
  bank_iban text,
  bank_bic text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null,
  jersey_number int,
  role public.app_role not null default 'player',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint team_members_user_once unique (team_id, user_id),
  constraint team_members_jersey_positive check (jersey_number is null or jersey_number > 0)
);

create table public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  type public.catalog_type not null,
  name text not null,
  description text,
  amount_cents int not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_items_amount_positive check (amount_cents >= 0)
);

create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  member_id uuid not null references public.team_members(id) on delete restrict,
  catalog_item_id uuid references public.catalog_items(id) on delete set null,
  type public.ledger_type not null,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_amount_cents int not null,
  total_amount_cents int not null,
  status public.ledger_status not null default 'open',
  booking_date date not null default current_date,
  notes text,
  correction_of uuid references public.ledger_entries(id) on delete set null,
  created_by uuid references public.team_members(id) on delete set null,
  voided_by uuid references public.team_members(id) on delete set null,
  voided_at timestamptz,
  void_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ledger_entries_quantity_positive check (quantity > 0),
  constraint ledger_entries_payment_negative check (
    (type = 'payment' and total_amount_cents <= 0)
    or (type <> 'payment')
  )
);

create table public.payment_allocations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  payment_entry_id uuid not null references public.ledger_entries(id) on delete cascade,
  charge_entry_id uuid not null references public.ledger_entries(id) on delete cascade,
  amount_cents int not null,
  created_at timestamptz not null default now(),
  constraint payment_allocations_amount_positive check (amount_cents > 0),
  constraint payment_allocations_distinct_entries check (payment_entry_id <> charge_entry_id)
);

create index team_members_team_id_idx on public.team_members(team_id);
create index team_members_user_id_idx on public.team_members(user_id);
create index catalog_items_team_type_idx on public.catalog_items(team_id, type);
create index ledger_entries_team_member_idx on public.ledger_entries(team_id, member_id);
create index ledger_entries_created_at_idx on public.ledger_entries(created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger teams_touch_updated_at
before update on public.teams
for each row execute function public.touch_updated_at();

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger team_members_touch_updated_at
before update on public.team_members
for each row execute function public.touch_updated_at();

create trigger catalog_items_touch_updated_at
before update on public.catalog_items
for each row execute function public.touch_updated_at();

create trigger ledger_entries_touch_updated_at
before update on public.ledger_entries
for each row execute function public.touch_updated_at();

create or replace function public.assert_ledger_team_integrity()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.team_members tm
    where tm.id = new.member_id
      and tm.team_id = new.team_id
  ) then
    raise exception 'ledger member must belong to the same team';
  end if;

  if new.catalog_item_id is not null and not exists (
    select 1
    from public.catalog_items ci
    where ci.id = new.catalog_item_id
      and ci.team_id = new.team_id
  ) then
    raise exception 'ledger catalog item must belong to the same team';
  end if;

  return new;
end;
$$;

create trigger ledger_entries_assert_team_integrity
before insert or update on public.ledger_entries
for each row execute function public.assert_ledger_team_integrity();

create or replace function public.assert_payment_allocation_integrity()
returns trigger
language plpgsql
as $$
declare
  payment_member uuid;
  charge_member uuid;
begin
  select le.member_id into payment_member
  from public.ledger_entries le
  where le.id = new.payment_entry_id
    and le.team_id = new.team_id
    and le.type = 'payment';

  select le.member_id into charge_member
  from public.ledger_entries le
  where le.id = new.charge_entry_id
    and le.team_id = new.team_id
    and le.type <> 'payment';

  if payment_member is null or charge_member is null or payment_member <> charge_member then
    raise exception 'payment allocation entries must belong to the same team and member';
  end if;

  return new;
end;
$$;

create trigger payment_allocations_assert_integrity
before insert or update on public.payment_allocations
for each row execute function public.assert_payment_allocation_integrity();

create or replace function public.is_team_member(check_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members tm
    where tm.team_id = check_team_id
      and tm.user_id = auth.uid()
      and tm.active = true
  );
$$;

create or replace function public.is_team_admin(check_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members tm
    where tm.team_id = check_team_id
      and tm.user_id = auth.uid()
      and tm.role = 'admin'
      and tm.active = true
  );
$$;

create or replace function public.is_own_member(check_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members tm
    where tm.id = check_member_id
      and tm.user_id = auth.uid()
      and tm.active = true
  );
$$;

create or replace function public.team_has_no_members(check_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.team_members tm
    where tm.team_id = check_team_id
  );
$$;

alter table public.teams enable row level security;
alter table public.profiles enable row level security;
alter table public.team_members enable row level security;
alter table public.catalog_items enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.payment_allocations enable row level security;

create policy "members can read their team"
on public.teams for select
using (public.is_team_member(id));

create policy "authenticated users can create teams"
on public.teams for insert
to authenticated
with check (true);

create policy "admins can update their team"
on public.teams for update
using (public.is_team_admin(id))
with check (public.is_team_admin(id));

create policy "users can read own profile"
on public.profiles for select
using (id = auth.uid());

create policy "users can insert own profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

create policy "users can update own profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "admins see team members and players see themselves"
on public.team_members for select
using (public.is_team_admin(team_id) or user_id = auth.uid());

create policy "admins can create members plus first admin bootstrap"
on public.team_members for insert
to authenticated
with check (
  public.is_team_admin(team_id)
  or (
    user_id = auth.uid()
    and role = 'admin'
    and public.team_has_no_members(team_id)
  )
);

create policy "admins can update members"
on public.team_members for update
using (public.is_team_admin(team_id))
with check (public.is_team_admin(team_id));

create policy "admins can delete members"
on public.team_members for delete
using (public.is_team_admin(team_id));

create policy "team members can read catalog"
on public.catalog_items for select
using (public.is_team_member(team_id));

create policy "admins can create catalog items"
on public.catalog_items for insert
to authenticated
with check (public.is_team_admin(team_id));

create policy "admins can update catalog items"
on public.catalog_items for update
using (public.is_team_admin(team_id))
with check (public.is_team_admin(team_id));

create policy "admins can delete catalog items"
on public.catalog_items for delete
using (public.is_team_admin(team_id));

create policy "admins read team ledger and players read own ledger"
on public.ledger_entries for select
using (public.is_team_admin(team_id) or public.is_own_member(member_id));

create policy "admins can create ledger entries"
on public.ledger_entries for insert
to authenticated
with check (public.is_team_admin(team_id));

create policy "admins can update ledger entries"
on public.ledger_entries for update
using (public.is_team_admin(team_id))
with check (public.is_team_admin(team_id));

create policy "admins read allocations and players read own allocations"
on public.payment_allocations for select
using (
  public.is_team_admin(team_id)
  or exists (
    select 1
    from public.ledger_entries le
    where le.id in (payment_entry_id, charge_entry_id)
      and public.is_own_member(le.member_id)
  )
);

create policy "admins can create payment allocations"
on public.payment_allocations for insert
to authenticated
with check (public.is_team_admin(team_id));

create policy "admins can update payment allocations"
on public.payment_allocations for update
using (public.is_team_admin(team_id))
with check (public.is_team_admin(team_id));

create policy "admins can delete payment allocations"
on public.payment_allocations for delete
using (public.is_team_admin(team_id));

create or replace view public.member_balances
with (security_invoker = true)
as
select
  tm.team_id,
  tm.id as member_id,
  tm.display_name,
  coalesce(sum(case when le.status <> 'voided' and le.type = 'fine' then le.total_amount_cents else 0 end), 0)::int as fine_cents,
  coalesce(sum(case when le.status <> 'voided' and le.type = 'drink' then le.total_amount_cents else 0 end), 0)::int as drink_cents,
  coalesce(sum(case when le.status <> 'voided' and le.type = 'adjustment' then le.total_amount_cents else 0 end), 0)::int as adjustment_cents,
  coalesce(sum(case when le.status <> 'voided' and le.type = 'payment' then -le.total_amount_cents else 0 end), 0)::int as payment_cents,
  coalesce(sum(case when le.status = 'open' and le.type in ('fine', 'drink', 'adjustment') then le.total_amount_cents else 0 end), 0)::int as open_charge_cents,
  coalesce(sum(case when le.status <> 'voided' then le.total_amount_cents else 0 end), 0)::int as balance_cents
from public.team_members tm
left join public.ledger_entries le on le.member_id = tm.id
where tm.active = true
group by tm.team_id, tm.id, tm.display_name;
