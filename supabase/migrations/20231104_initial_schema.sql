-- Supabase migration for Milk Retail (adapted from Whiz‑Barber)
-- Run via `supabase db push` or in the Supabase SQL editor

create extension if not exists "uuid-ossp";

-- Auth tables are provided by Supabase (auth.users)

-- Optional profile table for extra user metadata
create schema if not exists public;

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    role text,
    created_at timestamp with time zone default now()
);

-- Suppliers (milk providers)
create table if not exists public.suppliers (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    contact_name text,
    email text,
    phone text,
    address text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Categories (product groups)
create table if not exists public.categories (
    id uuid primary key default uuid_generate_v4(),
    name text not null unique,
    description text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Products (catalogue items)
create table if not exists public.products (
    id uuid primary key default uuid_generate_v4(),
    sku text unique not null,
    name text not null,
    description text,
    category_id uuid references public.categories(id) on delete set null,
    supplier_id uuid references public.suppliers(id) on delete set null,
    unit_price numeric(10,2) not null default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Inventory (current stock per product)
create table if not exists public.inventory (
    product_id uuid primary key references public.products(id) on delete cascade,
    quantity integer not null default 0,
    last_stock_count timestamp with time zone default now()
);

-- Stock movements (inbound/outbound adjustments)
create type public.movement_direction as enum ('inbound', 'outbound');

create table if not exists public.stock_movements (
    id uuid primary key default uuid_generate_v4(),
    product_id uuid references public.products(id) on delete cascade,
    quantity integer not null,
    direction public.movement_direction not null,
    note text,
    performed_by uuid references auth.users(id) on delete set null,
    created_at timestamp with time zone default now()
);

-- Purchase orders (incoming stock)
create table if not exists public.purchase_orders (
    id uuid primary key default uuid_generate_v4(),
    supplier_id uuid references public.suppliers(id) on delete set null,
    status text not null default 'draft',
    total_amount numeric(12,2) not null default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create table if not exists public.purchase_order_items (
    id uuid primary key default uuid_generate_v4(),
    order_id uuid references public.purchase_orders(id) on delete cascade,
    product_id uuid references public.products(id) on delete cascade,
    quantity integer not null,
    unit_price numeric(10,2) not null,
    line_total numeric(12,2) generated always as (quantity * unit_price) stored
);

-- Sales (outbound stock)
create table if not exists public.sales (
    id uuid primary key default uuid_generate_v4(),
    customer_name text,
    total_amount numeric(12,2) not null default 0,
    status text not null default 'pending',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create table if not exists public.sale_items (
    id uuid primary key default uuid_generate_v4(),
    sale_id uuid references public.sales(id) on delete cascade,
    product_id uuid references public.products(id) on delete cascade,
    quantity integer not null,
    unit_price numeric(10,2) not null,
    line_total numeric(12,2) generated always as (quantity * unit_price) stored
);

-- Trigger to keep inventory in sync with stock_movements
create or replace function public.update_inventory_on_movement() returns trigger language plpgsql as $$
begin
    if NEW.direction = 'inbound' then
        update public.inventory set quantity = quantity + NEW.quantity, last_stock_count = now() where product_id = NEW.product_id;
        if NOT FOUND then
            insert into public.inventory(product_id, quantity) values (NEW.product_id, NEW.quantity);
        end if;
    else
        update public.inventory set quantity = greatest(quantity - NEW.quantity, 0), last_stock_count = now() where product_id = NEW.product_id;
    end if;
    return NEW;
end;
$$;

create trigger trg_stock_movement
    after insert on public.stock_movements
    for each row execute function public.update_inventory_on_movement();

-- Enable Row Level Security (RLS) – permissive policies (adjust as needed)
alter table public.suppliers enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.inventory enable row level security;
alter table public.stock_movements enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;

create policy "allow_all" on public.suppliers for all using (true);
create policy "allow_all" on public.categories for all using (true);
create policy "allow_all" on public.products for all using (true);
create policy "allow_all" on public.inventory for all using (true);
create policy "allow_all" on public.stock_movements for all using (true);
create policy "allow_all" on public.purchase_orders for all using (true);
create policy "allow_all" on public.purchase_order_items for all using (true);
create policy "allow_all" on public.sales for all using (true);
create policy "allow_all" on public.sale_items for all using (true);

