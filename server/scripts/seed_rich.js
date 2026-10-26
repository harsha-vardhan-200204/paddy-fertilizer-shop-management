import { createStore } from "../store/index.js";
import { calculateInvoice } from "../utils/reports.js";
import bcrypt from "bcryptjs";

async function run() {
  console.log("Starting rich database seeder...");
  const store = await createStore();
  console.log(`Connected to store of kind: ${store.kind}`);

  // 1. Clear database
  if (store.kind === "local-file") {
    const collections = [
      "users", "products", "customers", "suppliers", 
      "sales", "sale_items", "purchases", "purchase_items", 
      "payments", "stock_logs"
    ];
    store.db = Object.fromEntries(collections.map(key => [key, []]));
    await store.persist();
  } else if (store.kind === "postgres") {
    await store.pool.query(`
      TRUNCATE TABLE sale_items, sales, purchase_items, purchases, 
                     payments, stock_logs, products, customers, suppliers, users CASCADE
    `);
  }

  // 2. Create Users
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const staffPasswordHash = await bcrypt.hash("staff123", 10);
  
  const admin = await store.create("users", {
    name: "Admin Owner",
    username: "admin",
    role: "admin",
    password_hash: adminPasswordHash
  });
  
  await store.create("users", {
    name: "Billing Staff",
    username: "staff",
    role: "staff",
    password_hash: staffPasswordHash
  });
  
  console.log("Created users (admin/admin123, staff/staff123).");

  // 3. Create Suppliers
  const supplierData = [
    { name: "Karnataka Agro Distributors", contact_person: "Ramesh Gowda", mobile: "9876500011", address: "APMC Yard, Mandya", gstin: "29AAKCK1234P1Z2", outstanding_amount: 0 },
    { name: "Varsha Fertilizers Ltd", contact_person: "Vijay Kumar", mobile: "9845012345", address: "Peenya Industrial Area, Bengaluru", gstin: "29AABCV5544R1Z0", outstanding_amount: 0 },
    { name: "Bhadravathi Seeds Co", contact_person: "Suresh Patil", mobile: "9900112233", address: "APMC Road, Bhadravathi", gstin: "29AABCB9988Q1ZA", outstanding_amount: 0 },
    { name: "Agro-Chemicals India", contact_person: "Anand Sen", mobile: "9880123456", address: "Whitefield, Bengaluru", gstin: "29AAICA4433D1Z5", outstanding_amount: 0 }
  ];
  
  const suppliers = [];
  for (const s of supplierData) {
    suppliers.push(await store.create("suppliers", s));
  }
  console.log(`Created ${suppliers.length} suppliers.`);

  // 4. Create Customers (Farmers) with different payment behaviors
  // Mahadeva: pays fast (avg delay 5 days)
  // Basappa: pays average (avg delay 15 days)
  // Ananth Gowda: pays slow (avg delay 30 days)
  // Chikkaiah: pays very slow/delays (avg delay 45 days)
  // Kenchappa: high risk / long delay (avg delay 60 days)
  const customerData = [
    { name: "Mahadeva", mobile: "9900012345", village: "Srirangapatna", address: "Near Milk Dairy", aadhaar: "111122223333", credit_amount: 0, pending_balance: 0, delay_factor: 5 },
    { name: "Basappa", mobile: "9845098765", village: "Hale Kunduvada", address: "Opposite Temple", aadhaar: "444455556666", credit_amount: 0, pending_balance: 0, delay_factor: 15 },
    { name: "Ananth Gowda", mobile: "9741001122", village: "Hadadi", address: "Gowda Colony", aadhaar: "777788889999", credit_amount: 0, pending_balance: 0, delay_factor: 30 },
    { name: "Chikkaiah", mobile: "9632003344", village: "Kadur", address: "Main Street", aadhaar: "123412341234", credit_amount: 0, pending_balance: 0, delay_factor: 45 },
    { name: "Kenchappa", mobile: "9945005566", village: "Anaji", address: "Near School", aadhaar: "987698769876", credit_amount: 0, pending_balance: 0, delay_factor: 60 },
    { name: "Ningappa", mobile: "9880007788", village: "Hadadi", address: "Post Office Road", aadhaar: "345634563456", credit_amount: 0, pending_balance: 0, delay_factor: 12 },
    { name: "Siddaramaiah", mobile: "9591008899", village: "Srirangapatna", address: "River View Road", aadhaar: "567856785678", credit_amount: 0, pending_balance: 0, delay_factor: 20 },
    { name: "Malleshappa", mobile: "9141009900", village: "Anaji", address: "Bazaar Road", aadhaar: "234523452345", credit_amount: 0, pending_balance: 0, delay_factor: 25 }
  ];

  const customers = [];
  for (const c of customerData) {
    const { delay_factor, ...dbCustomer } = c;
    const created = await store.create("customers", dbCustomer);
    created.delay_factor = delay_factor; 
    customers.push(created);
  }
  console.log(`Created ${customers.length} customers.`);

  // 5. Create Products
  const productData = [
    { name: "Urea 45kg", brand: "IFFCO", category: "Fertilizer", product_type: "Urea", hsn_code: "31021000", gst_percent: 5, batch_number: "BAG-UR-2401", unit: "Bag", purchase_price: 245, mrp: 300, selling_price: 285, current_stock: 500, minimum_stock_alert: 50, supplier_id: suppliers[0].id, supplier_name: suppliers[0].name },
    { name: "DAP 50kg", brand: "Coromandel", category: "Fertilizer", product_type: "DAP", hsn_code: "31053000", gst_percent: 5, batch_number: "DAP-2402", unit: "Bag", purchase_price: 1200, mrp: 1450, selling_price: 1380, current_stock: 300, minimum_stock_alert: 30, supplier_id: suppliers[1].id, supplier_name: suppliers[1].name },
    { name: "MOP Potash 50kg", brand: "IPL", category: "Fertilizer", product_type: "Potash", hsn_code: "31042000", gst_percent: 5, batch_number: "POT-2403", unit: "Bag", purchase_price: 880, mrp: 1020, selling_price: 985, current_stock: 200, minimum_stock_alert: 20, supplier_id: suppliers[0].id, supplier_name: suppliers[0].name },
    { name: "Paddy Seeds MTU-1010", brand: "Nuziveedu", category: "Seeds", product_type: "Seeds", hsn_code: "10061010", gst_percent: 0, batch_number: "SED-2401", unit: "Packet", purchase_price: 720, mrp: 850, selling_price: 820, current_stock: 150, minimum_stock_alert: 25, supplier_id: suppliers[2].id, supplier_name: suppliers[2].name },
    { name: "Zinc Sulphate 10kg", brand: "Zuari", category: "Micronutrients", product_type: "Micronutrients", hsn_code: "28332990", gst_percent: 12, batch_number: "MIC-2401", unit: "Kg", purchase_price: 410, mrp: 520, selling_price: 495, current_stock: 80, minimum_stock_alert: 15, supplier_id: suppliers[0].id, supplier_name: suppliers[0].name },
    { name: "Superphosphate 50kg", brand: "Rama Phosphate", category: "Fertilizer", product_type: "Organic fertilizer", hsn_code: "31031100", gst_percent: 12, batch_number: "ORG-2404", unit: "Bag", purchase_price: 380, mrp: 480, selling_price: 450, current_stock: 120, minimum_stock_alert: 15, supplier_id: suppliers[1].id, supplier_name: suppliers[1].name },
    { name: "Glyphosate Weedicide 1L", brand: "Monsanto", category: "Pesticide", product_type: "Pesticide", hsn_code: "38089390", gst_percent: 18, batch_number: "PES-2401", unit: "Litre", purchase_price: 520, mrp: 650, selling_price: 610, current_stock: 100, minimum_stock_alert: 15, supplier_id: suppliers[3].id, supplier_name: suppliers[3].name },
    { name: "Neem Oil Pest Control 1L", brand: "Multiplex", category: "Pesticide", product_type: "Pesticide", hsn_code: "38089190", gst_percent: 5, batch_number: "PES-2402", unit: "Litre", purchase_price: 260, mrp: 340, selling_price: 310, current_stock: 75, minimum_stock_alert: 10, supplier_id: suppliers[3].id, supplier_name: suppliers[3].name },
    { name: "Tomato Hybrid Seeds", brand: "Seminis", category: "Seeds", product_type: "Seeds", hsn_code: "12099190", gst_percent: 0, batch_number: "SED-2402", unit: "Packet", purchase_price: 380, mrp: 480, selling_price: 440, current_stock: 90, minimum_stock_alert: 10, supplier_id: suppliers[2].id, supplier_name: suppliers[2].name },
    { name: "Monocrotophos 1L", brand: "UPL", category: "Pesticide", product_type: "Pesticide", hsn_code: "38085900", gst_percent: 18, batch_number: "PES-2403", unit: "Litre", purchase_price: 480, mrp: 600, selling_price: 560, current_stock: 60, minimum_stock_alert: 10, supplier_id: suppliers[3].id, supplier_name: suppliers[3].name }
  ];

  const products = [];
  for (const p of productData) {
    const mfgDate = new Date();
    mfgDate.setMonth(mfgDate.getMonth() - 3);
    const expDate = new Date();
    expDate.setFullYear(expDate.getFullYear() + 1);

    products.push(await store.create("products", {
      ...p,
      manufacture_date: mfgDate.toISOString().slice(0, 10),
      expiry_date: expDate.toISOString().slice(0, 10)
    }));
  }
  console.log(`Created ${products.length} products.`);

  const now = new Date();
  const startTime = now.getTime() - 180 * 24 * 60 * 60 * 1000;
  
  const paymentsQueue = [];
  let salesCreated = 0;
  let purchasesCreated = 0;
  let paymentsCreated = 0;

  const mockUser = { name: "Admin Owner" };

  console.log("Simulating 180 days of transactions (historical timeline)...");

  for (let dayOffset = 0; dayOffset <= 180; dayOffset++) {
    const currentDayTime = startTime + dayOffset * 24 * 60 * 60 * 1000;
    const currentDate = new Date(currentDayTime);
    const dateStr = currentDate.toISOString().slice(0, 10);
    const month = currentDate.getMonth(); 

    let seasonalMultiplier = 1.0;
    if ([5, 6, 7].includes(month)) seasonalMultiplier = 2.5; 
    if ([10, 11].includes(month)) seasonalMultiplier = 1.8; 
    if ([2, 3, 4].includes(month)) seasonalMultiplier = 0.5; 

    if (dayOffset % 14 === 0) {
      const supplier = suppliers[dayOffset % suppliers.length];
      const purchaseItemsList = [];
      const itemTypes = ["Urea 45kg", "DAP 50kg", "MOP Potash 50kg"];
      
      for (const itemName of itemTypes) {
        const prod = products.find(p => p.name === itemName);
        if (prod) {
          purchaseItemsList.push({
            product_id: prod.id,
            qty: 100, 
            purchase_rate: prod.purchase_price,
            gst: Math.round(prod.purchase_price * 100 * (prod.gst_percent / 100)) / 100,
            total_amount: prod.purchase_price * 100
          });
        }
      }

      await store.createPurchase({
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        invoice_number: `PUR-IN-${dayOffset}-${1000 + Math.round(Math.random() * 9000)}`,
        purchase_date: dateStr,
        items: purchaseItemsList
      }, mockUser);
      purchasesCreated++;
    }

    const todaysPayments = paymentsQueue.filter(p => p.paymentDate === dateStr);
    for (const pay of todaysPayments) {
      await store.createPayment({
        customer_id: pay.customerId,
        amount: pay.amount,
        payment_method: Math.random() > 0.3 ? "Cash" : "UPI",
        note: `Clearing dues from sale on ${pay.saleDate}`,
        created_at: dateStr 
      }, mockUser);
      paymentsCreated++;
    }

    const salesCount = Math.round((Math.random() * 2 + 1) * seasonalMultiplier);
    
    for (let s = 0; s < salesCount; s++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const itemsCount = Math.floor(Math.random() * 3) + 1;
      const selectedProducts = [];
      const usedIds = new Set();
      
      while (selectedProducts.length < itemsCount) {
        const prod = products[Math.floor(Math.random() * products.length)];
        if (!usedIds.has(prod.id)) {
          selectedProducts.push(prod);
          usedIds.add(prod.id);
        }
      }

      const saleItemsList = [];
      for (const prod of selectedProducts) {
        let qty = Math.floor(Math.random() * 4) + 1;
        if (prod.product_type === "Urea" || prod.product_type === "DAP") {
          qty = Math.floor(Math.random() * 8) + 2; 
        }
        
        saleItemsList.push({
          product_id: prod.id,
          qty,
          rate: prod.selling_price,
          discount: Math.random() > 0.7 ? (Math.floor(Math.random() * 3) + 1) * 10 : 0
        });
      }

      const preview = await calculateInvoice(saleItemsList, store);
      let amountPaid = 0;
      const paysUpfront = Math.random() > (customer.delay_factor / 60); 
      
      if (paysUpfront) {
        amountPaid = preview.grand_total; 
      } else {
        amountPaid = Math.random() > 0.5 ? Math.round(preview.grand_total * 0.3) : 0;
      }

      const balanceDue = preview.grand_total - amountPaid;

      await store.createSale({
        ...preview,
        customer_id: customer.id,
        customer_name: customer.name,
        date: dateStr,
        amount_paid: amountPaid,
        balance_due: balanceDue,
        payment_method: amountPaid > 0 ? "Cash" : "Credit"
      }, mockUser);

      salesCreated++;

      if (balanceDue > 0) {
        const actualDelay = Math.max(1, customer.delay_factor + Math.floor(Math.random() * 11) - 5);
        const paymentTime = currentDayTime + actualDelay * 24 * 60 * 60 * 1000;
        const paymentDateStr = new Date(paymentTime).toISOString().slice(0, 10);
        
        if (paymentTime <= now.getTime()) {
          paymentsQueue.push({
            customerId: customer.id,
            amount: balanceDue,
            saleDate: dateStr,
            paymentDate: paymentDateStr
          });
        }
      }
    }
  }

  console.log("Historical timeline seeding complete!");
  console.log(`Summary of Seeding:`);
  console.log(`- Purchases generated: ${purchasesCreated}`);
  console.log(`- Sales generated: ${salesCreated}`);
  console.log(`- Payments generated: ${paymentsCreated}`);
  
  if (store.kind === "local-file") {
    console.log("Customer Final Outstanding Balances (Local File Store):");
    store.db.customers.forEach(c => {
      console.log(`  Farmer: ${c.name.padEnd(15)} | Pending Balance: ₹${c.pending_balance.toFixed(2)}`);
    });
  } else {
    const rows = await store.many("select name, pending_balance from customers");
    console.log("Customer Final Outstanding Balances (Postgres Store):");
    rows.forEach(c => {
      console.log(`  Farmer: ${c.name.padEnd(15)} | Pending Balance: ₹${Number(c.pending_balance).toFixed(2)}`);
    });
  }
}

run().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
