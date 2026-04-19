create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  cash_balance numeric not null default 100000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create table public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  side text not null check (side in ('BUY','SELL')),
  quantity numeric not null check (quantity > 0),
  price numeric not null check (price > 0),
  total numeric not null,
  created_at timestamptz not null default now()
);
alter table public.trades enable row level security;
create policy "Users view own trades" on public.trades for select using (auth.uid() = user_id);
create policy "Users insert own trades" on public.trades for insert with check (auth.uid() = user_id);
create index trades_user_created on public.trades(user_id, created_at desc);

create table public.positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  quantity numeric not null default 0,
  avg_price numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique(user_id, symbol)
);
alter table public.positions enable row level security;
create policy "Users view own positions" on public.positions for select using (auth.uid() = user_id);
create policy "Users insert own positions" on public.positions for insert with check (auth.uid() = user_id);
create policy "Users update own positions" on public.positions for update using (auth.uid() = user_id);
create policy "Users delete own positions" on public.positions for delete using (auth.uid() = user_id);

create table public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  created_at timestamptz not null default now(),
  unique(user_id, symbol)
);
alter table public.watchlist enable row level security;
create policy "Users view own watchlist" on public.watchlist for select using (auth.uid() = user_id);
create policy "Users insert own watchlist" on public.watchlist for insert with check (auth.uid() = user_id);
create policy "Users delete own watchlist" on public.watchlist for delete using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  insert into public.watchlist (user_id, symbol) values
    (new.id, 'BTCUSDT'),(new.id, 'ETHUSDT'),(new.id, 'SOLUSDT');
  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.execute_trade(_symbol text, _side text, _quantity numeric, _price numeric)
returns json language plpgsql security definer set search_path = public as $$
declare
  _user uuid := auth.uid();
  _total numeric := _quantity * _price;
  _cash numeric;
  _pos public.positions%rowtype;
  _new_qty numeric;
  _new_avg numeric;
begin
  if _user is null then raise exception 'Not authenticated'; end if;
  if _side not in ('BUY','SELL') then raise exception 'Invalid side'; end if;
  if _quantity <= 0 or _price <= 0 then raise exception 'Invalid amount'; end if;

  select cash_balance into _cash from public.profiles where id = _user for update;
  select * into _pos from public.positions where user_id = _user and symbol = _symbol for update;

  if _side = 'BUY' then
    if _cash < _total then raise exception 'Insufficient funds'; end if;
    update public.profiles set cash_balance = cash_balance - _total, updated_at = now() where id = _user;
    if _pos.id is null then
      insert into public.positions(user_id, symbol, quantity, avg_price) values (_user, _symbol, _quantity, _price);
    else
      _new_qty := _pos.quantity + _quantity;
      _new_avg := ((_pos.avg_price * _pos.quantity) + (_price * _quantity)) / _new_qty;
      update public.positions set quantity = _new_qty, avg_price = _new_avg, updated_at = now() where id = _pos.id;
    end if;
  else
    if _pos.id is null or _pos.quantity < _quantity then raise exception 'Insufficient holdings'; end if;
    update public.profiles set cash_balance = cash_balance + _total, updated_at = now() where id = _user;
    _new_qty := _pos.quantity - _quantity;
    if _new_qty = 0 then
      delete from public.positions where id = _pos.id;
    else
      update public.positions set quantity = _new_qty, updated_at = now() where id = _pos.id;
    end if;
  end if;

  insert into public.trades(user_id, symbol, side, quantity, price, total)
  values (_user, _symbol, _side, _quantity, _price, _total);

  return json_build_object('success', true);
end; $$;