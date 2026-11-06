-- Migration: create inventory schema for Milk Retail app
-- Run this via Supabase dashboard > SQL editor or supabase cli

create schema if not exists public;

create table if not exists public.inventory (
    id uuid primary key default uuid_generate_v4(),
    product_name text not null,
    sku text unique,
    quantity integer not null default 0,
    unit_price numeric(10,2) not null default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Trigger to auto‑update updated_at column
define function public.update_timestamp() returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger set_timestamp_before_update
    before update on public.inventory
    for each row execute function public.update_timestamp();

-- Enable row level security (RLS) – optional but recommended
alter table public.inventory enable row level security;

-- Example policy allowing authenticated users to CRUD their rows
create policy "allow all" on public.inventory for all using (true);

-- Ensure the uuid‑ossp extension is available
create extension if not exists "uuid-ossp";

