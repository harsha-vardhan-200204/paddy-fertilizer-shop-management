create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  username text unique not null,
  password_hash text not null,
  role text not null check (role in ('admin', 'staff', 'owner')),
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
  email text,
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
  customer_email text,
  village text,
  billing_address text,
  gstin text,
  customer_aadhaar text,
  subtotal numeric(12,2) default 0,
  cgst numeric(12,2) default 0,
  sgst numeric(12,2) default 0,
  igst numeric(12,2) default 0,
  total_tax numeric(12,2) default 0,
  round_off numeric(12,2) default 0,
  grand_total numeric(12,2) default 0,
  amount_paid numeric(12,2) default 0,
  balance_due numeric(12,2) default 0,
  payment_method text default 'Cash',
  payment_status text default 'PAID',
  status text default 'ISSUED',
  cancellation_reason text,
  cancelled_at timestamptz,
  cancelled_by text,
  is_interstate boolean default false,
  state_of_supply text default '29 - Karnataka',
  due_date date,
  pdf_path text,
  whatsapp_status text default 'PENDING',
  email_status text default 'PENDING',
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
  unit text default 'Bag',
  qty numeric(12,2) not null,
  rate numeric(12,2) not null,
  discount numeric(12,2) default 0,
  taxable_amount numeric(12,2) default 0,
  gst_percent numeric(5,2) default 0,
  cgst numeric(12,2) default 0,
  sgst numeric(12,2) default 0,
  igst numeric(12,2) default 0,
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
  payment_id text,
  customer_id uuid references customers(id) on delete set null,
  customer_name text,
  supplier_id uuid references suppliers(id) on delete set null,
  sale_id uuid references sales(id) on delete set null,
  bill_number text,
  invoice_id text,
  amount numeric(12,2) not null,
  amount_paid numeric(12,2) default 0,
  payment_method text,
  payment_status text default 'Cleared',
  payment_date date default current_date,
  payment_time text,
  previous_outstanding numeric(12,2) default 0,
  remaining_outstanding numeric(12,2) default 0,
  note text,
  recorded_by text,
  created_by text,
  created_at timestamptz default now()
);

create table if not exists farmer_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  farmer_id uuid,
  farmer_name text,
  mobile text,
  village text,
  invoice_id text,
  sale_id uuid references sales(id) on delete set null,
  purchase_date date not null default current_date,
  due_date date,
  credit_amount numeric(12,2) not null,
  principal_amount numeric(12,2) not null,
  outstanding_principal numeric(12,2) not null,
  amount_paid numeric(12,2) default 0,
  interest_rate numeric(5,2) default 2.0,
  credit_due_days integer default 30,
  status text default 'PENDING',
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

create table if not exists invoice_sequences (
  financial_year text primary key,
  last_number integer not null default 0,
  updated_at timestamptz default now()
);

create table if not exists digital_deliveries (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references sales(id) on delete cascade,
  invoice_number text not null,
  channel text not null,
  recipient text not null,
  status text not null,
  message_id text,
  error_message text,
  details text,
  created_at timestamptz default now()
);

create table if not exists invoice_audit_logs (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null,
  action text not null,
  performed_by text,
  reason text,
  details text,
  created_at timestamptz default now()
);

create index if not exists idx_products_search on products using gin (to_tsvector('english', coalesce(name,'') || ' ' || coalesce(brand,'') || ' ' || coalesce(product_type,'')));
create index if not exists idx_sales_invoice on sales(invoice_number);
create index if not exists idx_sales_date on sales(date);
create index if not exists idx_purchases_date on purchases(purchase_date);
create index if not exists idx_stock_logs_product on stock_logs(product_id);
create index if not exists idx_deliveries_invoice on digital_deliveries(invoice_number);
create index if not exists idx_audit_invoice on invoice_audit_logs(invoice_number);
