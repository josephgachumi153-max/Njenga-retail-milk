alter table public.products
  add column if not exists reorder_level integer not null default 25;

alter table public.sales
  add column if not exists paid_amount numeric(12,2) not null default 0;

alter table public.sales
  add column if not exists credit_amount numeric(12,2) not null default 0;

alter table public.products
  add constraint products_reorder_level_nonnegative
  check (reorder_level >= 0);

alter table public.sales
  add constraint sales_paid_amount_nonnegative
  check (paid_amount >= 0);

alter table public.sales
  add constraint sales_credit_amount_nonnegative
  check (credit_amount >= 0);
