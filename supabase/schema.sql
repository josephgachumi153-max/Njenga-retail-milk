create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('Milk', 'Yoghurt', 'Sour/Mala')),
  brand text not null,
  size text not null,
  stock integer not null default 0 check (stock >= 0),
  reorder_level integer not null default 25 check (reorder_level >= 0),
  unit text not null default 'pieces',
  buy numeric(12,2) not null check (buy >= 0),
  sell numeric(12,2) not null check (sell >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null default '',
  credit numeric(12,2) not null default 0 check (credit >= 0),
  last_purchase_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id),
  amount numeric(12,2) not null check (amount >= 0),
  paid_amount numeric(12,2) not null default 0 check (paid_amount >= 0),
  credit_amount numeric(12,2) not null default 0 check (credit_amount >= 0),
  profit numeric(12,2) not null default 0,
  payment_method text not null check (payment_method in ('Cash', 'M-Pesa', 'Credit')),
  created_at timestamptz not null default now()
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_buy numeric(12,2) not null,
  unit_sell numeric(12,2) not null
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  quantity integer not null,
  movement_type text not null check (movement_type in ('purchase', 'sale', 'adjustment')),
  supplier text,
  unit_cost numeric(12,2),
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.stock_movements enable row level security;

create policy "authenticated users can manage products" on public.products for all to authenticated using (true) with check (true);
create policy "authenticated users can manage customers" on public.customers for all to authenticated using (true) with check (true);
create policy "authenticated users can manage sales" on public.sales for all to authenticated using (true) with check (true);
create policy "authenticated users can manage sale items" on public.sale_items for all to authenticated using (true) with check (true);
create policy "authenticated users can manage stock movements" on public.stock_movements for all to authenticated using (true) with check (true);

create index if not exists sales_created_at_idx on public.sales(created_at desc);
create index if not exists stock_movements_product_idx on public.stock_movements(product_id, created_at desc);

alter table public.products add column if not exists reorder_level integer not null default 25;
alter table public.sales add column if not exists paid_amount numeric(12,2) not null default 0;
alter table public.sales add column if not exists credit_amount numeric(12,2) not null default 0;
