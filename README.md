# Paddy Fertilizer Shop Management System

Full-stack GST billing and inventory application for an Indian fertilizer/agriculture store.

## Features

- Dashboard for today sales, monthly sales, purchase amount, stock value, low stock, dues, GST summary, and top products
- Product management with HSN, GST, batch, manufacture/expiry, pricing, supplier, and stock alert fields
- GST invoice generation with CGST/SGST split, payment status, print/save PDF support, and invoice search-ready backend
- Purchase entry that automatically updates stock
- Customer/farmer and supplier records
- Stock movement logs, low stock, and expiry alerts
- GST reports with CSV and Excel export
- Admin/staff login roles
- PostgreSQL/Supabase-ready schema, plus local persistent development store

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

Demo logins:

- Admin: `admin` / `admin123`
- Staff: `staff` / `staff123`

The app uses `server/data/store.json` for local persistent development if `DATABASE_URL` is not set.

## Supabase / PostgreSQL Setup

1. Create a Supabase project.
2. Open the SQL editor and run `database/schema.sql`.
3. Run `database/seed.sql` for demo users/products.
4. Copy `.env.example` to `.env`.
5. Set `DATABASE_URL` to your Supabase Postgres connection string.
6. Set a strong `JWT_SECRET`.
7. Run `npm run dev` or deploy the frontend to Vercel and the API to your Node host.

## Production Notes

- Change default passwords after seeding.
- Use HTTPS and a strong `JWT_SECRET`.
- Restrict staff-only permissions further if needed for your shop policy.
- Put the Express API behind a Node-capable host. The React frontend can be hosted on Vercel.
