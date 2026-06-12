-- Passwords are bcrypt hashes for:
-- admin / admin123
-- staff / staff123
-- maruthi / maruthi123
insert into users (name, username, role, password_hash)
values
  ('Admin', 'admin', 'admin', '$2b$10$U1cWasMfKIldKWjGIQ.7Ru2NlPqZ0vzeJWu8giRrStHFGe/9i2XUa'),
  ('Billing Staff', 'staff', 'staff', '$2b$10$CPTC6Z7e6ZUTLLSDNwAe6OQzoY0Q9HhwM2UIekH7odOlJ5u0yXFe2'),
  ('Maruthi', 'maruthi', 'admin', '$2b$10$CcNhjNItY/2KVDM.P.Rv8ulmM9nLnJrxu80cY6NEwdNkRAGMyn5Su')
on conflict (username) do nothing;

insert into suppliers (name, contact_person, mobile, address, gstin)
values ('Karnataka Agro Distributors', 'Ramesh Gowda', '9876500011', 'APMC Yard, Mandya', '29AAKCK1234P1Z2')
on conflict do nothing;

insert into customers (name, mobile, village, address)
values ('Mahadeva', '9900012345', 'Srirangapatna', 'Near Milk Dairy')
on conflict do nothing;

insert into products (name, brand, category, product_type, hsn_code, gst_percent, batch_number, manufacture_date, expiry_date, unit, purchase_price, mrp, selling_price, current_stock, minimum_stock_alert, supplier_name)
values
  ('Urea 45kg', 'IFFCO', 'Fertilizer', 'Urea', '31021000', 5, 'BAG-UR-2401', '2026-01-01', '2028-01-01', 'Bag', 245, 300, 285, 120, 20, 'Karnataka Agro Distributors'),
  ('DAP 50kg', 'Coromandel', 'Fertilizer', 'DAP', '31053000', 5, 'DAP-2402', '2026-01-01', '2028-01-01', 'Bag', 1200, 1450, 1380, 72, 12, 'Karnataka Agro Distributors'),
  ('MOP Potash 50kg', 'IPL', 'Fertilizer', 'Potash', '31042000', 5, 'POT-2403', '2026-01-01', '2028-01-01', 'Bag', 880, 1020, 985, 38, 10, 'Karnataka Agro Distributors'),
  ('Paddy Seeds MTU-1010', 'Nuziveedu', 'Seeds', 'Seeds', '10061010', 0, 'SED-2401', '2026-01-01', '2027-01-01', 'Packet', 720, 850, 820, 46, 8, 'Karnataka Agro Distributors'),
  ('Zinc Sulphate 10kg', 'Zuari', 'Micronutrients', 'Micronutrients', '28332990', 12, 'MIC-2401', '2026-01-01', '2028-01-01', 'Kg', 410, 520, 495, 15, 6, 'Karnataka Agro Distributors')
on conflict do nothing;
