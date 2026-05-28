create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  username text unique not null,
  password_hash text not null,
  role text not null check (role in ('admin', 'staff')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  mobile text,
  address text,
  gstin text,
  outstanding_amount numeric(12,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mobile text,
  village text,
  address text,
  aadhaar text,
  credit_amount numeric(12,2) default 0,
  pending_balance numeric(12,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  category text,
  product_type text not null,
  hsn_code text,
  gst_percent numeric(5,2) default 0,
  batch_number text,
  manufacture_date date,
  expiry_date date,
  unit text not null,
  purchase_price numeric(12,2) default 0,
  mrp numeric(12,2) default 0,
  selling_price numeric(12,2) default 0,
  current_stock numeric(12,2) default 0,
  minimum_stock_alert numeric(12,2) default 0,
  supplier_id uuid references suppliers(id) on delete set null,
  supplier_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique not null,
  date date not null default current_date,
  customer_id uuid references customers(id) on delete set null,
  customer_name text,
  mobile text,
  village text,
  billing_address text,
  gstin text,
  subtotal numeric(12,2) default 0,
  cgst numeric(12,2) default 0,
  sgst numeric(12,2) default 0,
  grand_total numeric(12,2) default 0,
  amount_paid numeric(12,2) default 0,
  balance_due numeric(12,2) default 0,
  payment_method text default 'Cash',
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references sales(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text,
  hsn_code text,
  qty numeric(12,2) not null,
  rate numeric(12,2) not null,
  discount numeric(12,2) default 0,
  gst_percent numeric(5,2) default 0,
  cgst numeric(12,2) default 0,
  sgst numeric(12,2) default 0,
  total numeric(12,2) default 0,
  created_at timestamptz default now()
);

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references suppliers(id) on delete set null,
  supplier_name text,
  invoice_number text not null,
  purchase_date date not null default current_date,
  total_amount numeric(12,2) default 0,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid references purchases(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  qty numeric(12,2) not null,
  purchase_rate numeric(12,2) not null,
  gst numeric(12,2) default 0,
  total_amount numeric(12,2) default 0,
  created_at timestamptz default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  supplier_id uuid references suppliers(id) on delete set null,
  amount numeric(12,2) not null,
  payment_method text,
  note text,
  created_by text,
  created_at timestamptz default now()
);

create table if not exists stock_logs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  product_name text,
  type text not null,
  qty numeric(12,2) not null,
  note text,
  created_by text,
  created_at timestamptz default now()
);

create index if not exists idx_products_search on products using gin (to_tsvector('english', coalesce(name,'') || ' ' || coalesce(brand,'') || ' ' || coalesce(product_type,'')));
create index if not exists idx_sales_invoice on sales(invoice_number);
create index if not exists idx_sales_date on sales(date);
create index if not exists idx_purchases_date on purchases(purchase_date);
create index if not exists idx_stock_logs_product on stock_logs(product_id);
