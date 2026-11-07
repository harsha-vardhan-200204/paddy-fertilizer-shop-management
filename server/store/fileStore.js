import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { round } from "../utils/reports.js";
import { predictionEngine } from "../services/predictionEngine.js";
import { getFinancialYear, formatInvoiceNumber, parseInvoiceNumber } from "../utils/invoiceNumber.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.resolve(__dirname, "../data/store.json");
const isVercel = process.env.VERCEL === "1";

const collections = [
  "users",
  "products",
  "customers",
  "suppliers",
  "sales",
  "sale_items",
  "purchases",
  "purchase_items",
  "payments",
  "farmer_credit_ledger",
  "credit_payments",
  "interest_history",
  "stock_logs",
  "digital_deliveries",
  "invoice_audit_logs",
  "invoice_sequences",
  "product_batches",
  "credit_settings",
  "expiry_alert_history"
];

export class FileStore {
  kind = "local-file";

  async init() {
    if (isVercel) {
      this.db = Object.fromEntries(collections.map((key) => [key, []]));
      await this.seed();
      return;
    }

    await fs.mkdir(path.dirname(dataPath), { recursive: true });
    try {
      this.db = JSON.parse(await fs.readFile(dataPath, "utf8"));
      let updatedUsers = false;
      this.db.users = this.db.users || [];
      if (!this.db.users.some((u) => u.username === "admin")) {
        this.db.users.push({
          id: id(),
          name: "Shop Admin",
          username: "admin",
          role: "admin",
          password_hash: await bcrypt.hash("admin123", 10)
        });
        updatedUsers = true;
      }
      if (!this.db.users.some((u) => u.username === "maruthi")) {
        this.db.users.push({
          id: id(),
          name: "Junji Maruthi",
          username: "maruthi",
          role: "admin",
          password_hash: await bcrypt.hash("maruthi123", 10)
        });
        updatedUsers = true;
      }
      if (!this.db.users.some((u) => u.username === "staff")) {
        this.db.users.push({
          id: id(),
          name: "Counter Staff",
          username: "staff",
          role: "employee",
          password_hash: await bcrypt.hash("staff123", 10)
        });
        updatedUsers = true;
      }
      if (updatedUsers) {
        await this.persist();
      }

      for (const col of collections) {
        if (!Array.isArray(this.db[col])) {
          this.db[col] = [];
        }
      }

      if (this.db.farmer_credit_ledger.length === 0 && (this.db.sales || []).length > 0) {
        let seededLedger = false;
        for (const sale of this.db.sales) {
          if (Number(sale.balance_due || 0) > 0 && sale.customer_id) {
            const match = String(sale.payment_method || "").match(/@\s*([0-9.]+)%/);
            const interestRate = match ? Number(match[1]) : 2;
            const daysMatch = String(sale.payment_method || "").match(/([0-9]+)\s*Days/i);
            const creditDays = daysMatch ? Number(daysMatch[1]) : 30;
            const pDate = sale.date || (sale.created_at ? sale.created_at.slice(0, 10) : today());
            const dueDate = new Date(new Date(pDate).getTime() + creditDays * 86400000).toISOString().slice(0, 10);
            this.db.farmer_credit_ledger.push({
              id: id(),
              customer_id: sale.customer_id,
              farmer_id: sale.customer_id,
              farmer_name: sale.customer_name || "Customer",
              mobile: sale.mobile || "",
              village: sale.village || "",
              invoice_id: sale.invoice_number,
              sale_id: sale.id,
              purchase_date: pDate,
              due_date: dueDate,
              credit_amount: Number(sale.balance_due),
              principal_amount: Number(sale.balance_due),
              outstanding_principal: Number(sale.balance_due),
              amount_paid: 0,
              interest_rate: interestRate,
              credit_due_days: creditDays,
              status: "PENDING",
              created_at: sale.created_at || now()
            });
            seededLedger = true;
          }
        }
        if (seededLedger) {
          await this.persist();
        }
      }

      // Ensure Credit Settings
      if (!this.db.credit_settings || this.db.credit_settings.length === 0) {
        this.db.credit_settings = [{
          id: "default",
          interest_enabled: true,
          monthly_interest_rate: 2.0,
          calculation_type: "simple",
          grace_period_days: 0,
          calculation_day: 1,
          payment_allocation_policy: "principal_first",
          default_credit_due_days: 30,
          expiry_alerts_enabled: true,
          alert_periods: "90,60,30,15,7,0",
          admin_notification_email: "harshavardhanjunji@gmail.com",
          admin_notification_whatsapp: "+918660548244",
          customer_bill_whatsapp_enabled: true,
          customer_bill_email_enabled: true,
          admin_expiry_email_enabled: true,
          admin_expiry_whatsapp_enabled: true,
          updated_at: now()
        }];
        await this.persist();
      }

      // Ensure Product Batches covering all expiry intervals
      if (!this.db.product_batches || this.db.product_batches.length === 0) {
        const todayMs = Date.now();
        const addDays = (d) => new Date(todayMs + d * 86400000).toISOString().slice(0, 10);
        const subDays = (d) => new Date(todayMs - d * 86400000).toISOString().slice(0, 10);

        const sampleBatches = [
          {
            id: id(),
            product_name: "Coromandel Gromor 14-35-14 (50kg Bag)",
            batch_number: "GRO-2026-N1",
            purchase_date: subDays(30),
            mfg_date: subDays(60),
            expiry_date: addDays(240), // >90 Days - GREEN
            initial_stock: 150,
            current_stock: 120,
            unit: "Bag",
            purchase_price: 1350,
            selling_price: 1470,
            supplier_name: "Coromandel International Ltd",
            status: "ACTIVE",
            created_at: now()
          },
          {
            id: id(),
            product_name: "DAP 50kg",
            batch_number: "DAP-2026-Y75",
            purchase_date: subDays(15),
            mfg_date: subDays(90),
            expiry_date: addDays(75), // 60-90 Days - YELLOW
            initial_stock: 100,
            current_stock: 85,
            unit: "Bag",
            purchase_price: 1200,
            selling_price: 1350,
            supplier_name: "IFFCO Hub Davangere",
            status: "DUE_SOON",
            created_at: now()
          },
          {
            id: id(),
            product_name: "MOP Potash 50kg",
            batch_number: "MOP-2026-O45",
            purchase_date: subDays(45),
            mfg_date: subDays(120),
            expiry_date: addDays(45), // 30-60 Days - ORANGE
            initial_stock: 80,
            current_stock: 45,
            unit: "Bag",
            purchase_price: 1550,
            selling_price: 1700,
            supplier_name: "IPL Potash Corporation",
            status: "WARNING",
            created_at: now()
          },
          {
            id: id(),
            product_name: "Paddy Seeds MTU-1010",
            batch_number: "SED-2026-R12",
            purchase_date: subDays(60),
            mfg_date: subDays(150),
            expiry_date: addDays(12), // <30 Days - RED
            initial_stock: 60,
            current_stock: 30,
            unit: "Bag",
            purchase_price: 850,
            selling_price: 980,
            supplier_name: "Karnataka State Seeds Corporation",
            status: "CRITICAL",
            created_at: now()
          },
          {
            id: id(),
            product_name: "Zinc Sulphate 10kg",
            batch_number: "ZNC-2025-EXP",
            purchase_date: subDays(180),
            mfg_date: subDays(365),
            expiry_date: subDays(8), // EXPIRED - QUARANTINED
            initial_stock: 50,
            current_stock: 18,
            unit: "Packet",
            purchase_price: 380,
            selling_price: 450,
            supplier_name: "Multiplex Bio Tech",
            status: "EXPIRED",
            created_at: now()
          }
        ];

        this.db.product_batches = sampleBatches;

        // Sync batch stock to products
        for (const batch of sampleBatches) {
          const prod = this.db.products.find(p => p.name.toLowerCase().includes(batch.product_name.slice(0, 10).toLowerCase()));
          if (prod) {
            batch.product_id = prod.id;
            prod.current_stock = Math.max(Number(prod.current_stock || 0), batch.current_stock);
            prod.batch_number = batch.batch_number;
            prod.expiry_date = batch.expiry_date;
          }
        }
        await this.persist();
      }

      // Ensure customer test emails
      if (this.db.customers && this.db.customers.length > 0) {
        let updatedCust = false;
        for (const cust of this.db.customers) {
          if (!cust.email) {
            cust.email = "harshavardhanjunji@gmail.com";
            updatedCust = true;
          }
        }
        if (updatedCust) await this.persist();
      }
    } catch (_error) {
      this.db = Object.fromEntries(collections.map((key) => [key, []]));
      await this.seed();
      await this.persist();
    }
  }

  async health() {
    return { ok: true };
  }

  async seed() {
    this.db.users.push(
      { id: id(), name: "Junji Maruthi", username: "maruthi", role: "admin", password_hash: await bcrypt.hash("maruthi123", 10) },
      { id: id(), name: "Shop Admin", username: "admin", role: "admin", password_hash: await bcrypt.hash("admin123", 10) },
      { id: id(), name: "Counter Staff", username: "staff", role: "employee", password_hash: await bcrypt.hash("staff123", 10) }
    );
    const supplierId = id();
    this.db.suppliers.push({
      id: supplierId,
      name: "Karnataka Agro Distributors",
      contact_person: "Ramesh Gowda",
      mobile: "9876500011",
      address: "APMC Yard, Mandya",
      gstin: "29AAKCK1234P1Z2",
      outstanding_amount: 0,
      created_at: now()
    });
    this.db.customers.push({
      id: id(),
      name: "Mahadeva",
      mobile: "9900012345",
      village: "Srirangapatna",
      address: "Near Milk Dairy",
      aadhaar: "",
      credit_amount: 0,
      pending_balance: 0,
      created_at: now()
    });
    const products = [
      ["Urea 45kg", "IFFCO", "Fertilizer", "Urea", "31021000", 5, "BAG-UR-2401", "Bag", 245, 300, 285, 120, 20],
      ["DAP 50kg", "Coromandel", "Fertilizer", "DAP", "31053000", 5, "DAP-2402", "Bag", 1200, 1450, 1380, 72, 12],
      ["MOP Potash 50kg", "IPL", "Fertilizer", "Potash", "31042000", 5, "POT-2403", "Bag", 880, 1020, 985, 38, 10],
      ["Paddy Seeds MTU-1010", "Nuziveedu", "Seeds", "Seeds", "10061010", 0, "SED-2401", "Packet", 720, 850, 820, 46, 8],
      ["Zinc Sulphate 10kg", "Zuari", "Micronutrients", "Micronutrients", "28332990", 12, "MIC-2401", "Kg", 410, 520, 495, 15, 6]
    ];
    for (const [name, brand, category, type, hsn_code, gst_percent, batch_number, unit, purchase_price, mrp, selling_price, current_stock, minimum_stock_alert] of products) {
      this.db.products.push({
        id: id(),
        name,
        brand,
        category,
        product_type: type,
        hsn_code,
        gst_percent,
        batch_number,
        manufacture_date: "2026-01-01",
        expiry_date: type === "Seeds" ? "2027-01-01" : "2028-01-01",
        unit,
        purchase_price,
        mrp,
        selling_price,
        current_stock,
        minimum_stock_alert,
        supplier_id: supplierId,
        supplier_name: "Karnataka Agro Distributors",
        created_at: now()
      });
    }
  }

  async persist() {
    if (isVercel) return;
    await fs.writeFile(dataPath, JSON.stringify(this.db, null, 2));
  }

  async findUser(username) {
    return this.db.users.find((user) => user.username === username);
  }

  async list(resource, query = {}) {
    const term = String(query.search || "").toLowerCase();
    let rows = [...(this.db[resource] || [])];
    if (term) {
      rows = rows.filter((row) => Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(term)));
    }
    return rows.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
  }

  async getById(resource, itemId) {
    return this.db[resource]?.find((item) => item.id === itemId);
  }

  async create(resource, data) {
    const record = { id: id(), ...data, created_at: now(), updated_at: now() };
    this.db[resource].push(record);
    await this.persist();
    return record;
  }

  async update(resource, itemId, data) {
    const index = this.db[resource].findIndex((item) => item.id === itemId);
    if (index < 0) throw Object.assign(new Error("Record not found"), { status: 404 });
    this.db[resource][index] = { ...this.db[resource][index], ...data, updated_at: now() };
    await this.persist();
    return this.db[resource][index];
  }

  async remove(resource, itemId) {
    this.db[resource] = this.db[resource].filter((item) => item.id !== itemId);
    if (resource === "purchases") {
      this.db.purchase_items = this.db.purchase_items.filter((item) => item.purchase_id !== itemId);
    }
    await this.persist();
  }

  async adjustStock(productId, data, user) {
    const product = await this.getById("products", productId);
    if (!product) throw Object.assign(new Error("Product not found"), { status: 404 });
    const qty = Number(data.qty || 0);
    product.current_stock = round(Number(product.current_stock || 0) + qty);
    this.db.stock_logs.push({
      id: id(),
      product_id: productId,
      product_name: product.name,
      type: data.type || "adjustment",
      qty,
      note: data.note || "",
      created_by: user?.name,
      created_at: now()
    });
    await this.persist();
    return product;
  }

  async listSales(query = {}) {
    return this.filterBySearch(this.db.sales, query, ["invoice_number", "customer_name", "mobile"]);
  }

  async getSale(saleId) {
    const sale = this.db.sales.find((item) => item.id === saleId || item.invoice_number === saleId);
    if (!sale) return null;
    return { ...sale, items: this.db.sale_items.filter((item) => item.sale_id === sale.id) };
  }

  getNextInvoiceNumber(dateInput = today()) {
    const fy = getFinancialYear(dateInput);
    this.db.invoice_sequences = this.db.invoice_sequences || {};
    if (this.db.invoice_sequences[fy] === undefined) {
      let maxSeq = 0;
      for (const s of (this.db.sales || [])) {
        const parsed = parseInvoiceNumber(s.invoice_number);
        if (parsed && parsed.fy === fy && parsed.seq > maxSeq) {
          maxSeq = parsed.seq;
        }
      }
      this.db.invoice_sequences[fy] = maxSeq;
    }
    this.db.invoice_sequences[fy] += 1;
    return formatInvoiceNumber(this.db.invoice_sequences[fy], fy, "SAG");
  }

  async createSale(data, user) {
    // Strict Product Expiry Validation: Block expired stock from sales
    const todayDate = today();
    for (const item of data.items || []) {
      const product = this.db.products.find(p => p.id === item.product_id);
      let batch = null;
      if (item.batch_number && this.db.product_batches) {
        batch = this.db.product_batches.find(b => b.batch_number === item.batch_number);
      }
      const expDate = batch?.expiry_date || product?.expiry_date;
      if (expDate && String(expDate) < todayDate) {
        const prodName = item.product_name || item.name || product?.name || "Product";
        const bNum = batch?.batch_number || product?.batch_number || "Default";
        throw Object.assign(
          new Error(`Strict Regulatory Warning: Stock for '${prodName}' (Batch: ${bNum}) EXPIRED on ${expDate}. Selling expired agricultural inputs is prohibited by government regulations. Please quarantine this batch.`),
          { status: 400 }
        );
      }
    }

    const customer = data.customer_id ? await this.getById("customers", data.customer_id) : null;
    const invNumber = data.invoice_number || this.getNextInvoiceNumber(data.date || today());
    const grandTotal = Number(data.grand_total || 0);
    const amountPaid = Number(data.amount_paid || 0);
    const balanceDue = round(Math.max(0, grandTotal - amountPaid));
    
    let paymentStatus = "PAID";
    if (balanceDue > 0 && amountPaid > 0) {
      paymentStatus = "PARTIAL";
    } else if (balanceDue > 0) {
      paymentStatus = "CREDIT";
    }

    const creditDays = Number(data.credit_days || 30);
    const interestRate = Number(data.interest_rate || 2);
    const pDate = data.date || today();
    const dueDate = data.due_date || new Date(new Date(pDate).getTime() + creditDays * 86400000).toISOString().slice(0, 10);

    const sale = {
      id: id(),
      invoice_number: invNumber,
      date: pDate,
      customer_id: data.customer_id || customer?.id || "",
      customer_name: data.customer_name || customer?.name || "",
      mobile: data.mobile || customer?.mobile || "",
      customer_email: data.customer_email || data.email || customer?.email || "",
      village: data.village || customer?.village || "",
      billing_address: data.billing_address || customer?.address || "",
      gstin: data.gstin || "",
      customer_aadhaar: data.customer_aadhaar || data.aadhaar_number || customer?.aadhaar || "",
      subtotal: round(data.subtotal),
      cgst: round(data.cgst),
      sgst: round(data.sgst),
      igst: round(data.igst || 0),
      total_tax: round(data.total_tax || (Number(data.cgst || 0) + Number(data.sgst || 0) + Number(data.igst || 0))),
      round_off: round(data.round_off || 0),
      grand_total: grandTotal,
      amount_paid: amountPaid,
      balance_due: balanceDue,
      payment_method: data.payment_method || "Cash",
      payment_status: paymentStatus,
      status: "ISSUED",
      is_interstate: Boolean(data.is_interstate),
      state_of_supply: data.state_of_supply || "29 - Karnataka",
      due_date: dueDate,
      pdf_path: data.pdf_path || "",
      whatsapp_status: "PENDING",
      email_status: "PENDING",
      created_by: user?.name || "Shop Admin",
      created_at: now()
    };
    this.db.sales.push(sale);

    for (const item of data.items || []) {
      this.db.sale_items.push({
        id: id(),
        sale_id: sale.id,
        product_id: item.product_id,
        product_name: item.product_name || item.name,
        hsn_code: item.hsn_code,
        unit: item.unit || "Bag",
        qty: item.qty,
        rate: item.rate,
        discount: item.discount || 0,
        taxable_amount: item.taxable_amount ?? (item.qty * item.rate - (item.discount || 0)),
        gst_percent: item.gst_percent,
        cgst: item.cgst || 0,
        sgst: item.sgst || 0,
        igst: item.igst || 0,
        total: item.total,
        created_at: now()
      });
      await this.adjustStock(item.product_id, { qty: -Number(item.qty || 0), type: "sale", note: sale.invoice_number }, user);
      if (item.batch_number && this.db.product_batches) {
        const batch = this.db.product_batches.find(b => b.batch_number === item.batch_number);
        if (batch) {
          batch.current_stock = round(Number(batch.current_stock || 0) - Number(item.qty || 0));
        }
      }
    }

    if (sale.customer_id && sale.balance_due > 0) {
      const customerIndex = this.db.customers.findIndex((item) => item.id === sale.customer_id);
      if (customerIndex >= 0) {
        this.db.customers[customerIndex].pending_balance = round(Number(this.db.customers[customerIndex].pending_balance || 0) + sale.balance_due);
        this.db.customers[customerIndex].credit_amount = this.db.customers[customerIndex].pending_balance;
      }
      this.db.farmer_credit_ledger = this.db.farmer_credit_ledger || [];
      this.db.farmer_credit_ledger.push({
        id: id(),
        customer_id: sale.customer_id,
        farmer_id: sale.customer_id,
        farmer_name: sale.customer_name,
        mobile: sale.mobile,
        village: sale.village,
        invoice_id: sale.invoice_number,
        sale_id: sale.id,
        purchase_date: pDate,
        due_date: dueDate,
        credit_amount: sale.balance_due,
        principal_amount: sale.balance_due,
        outstanding_principal: sale.balance_due,
        amount_paid: 0,
        interest_rate: interestRate,
        credit_due_days: creditDays,
        status: "PENDING",
        created_at: now()
      });
    }

    if (sale.amount_paid > 0) {
      const paymentTime = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      const payCount = (this.db.payments || []).length + 1;
      this.db.payments.push({
        id: id(),
        payment_id: nextNumber("PAY", payCount),
        customer_id: sale.customer_id,
        customer_name: sale.customer_name,
        farmer_id: sale.customer_id,
        farmer_name: sale.customer_name,
        sale_id: sale.id,
        bill_number: sale.invoice_number,
        invoice_id: sale.invoice_number,
        bill_date: sale.date,
        payment_date: sale.date,
        payment_time: paymentTime,
        amount: sale.amount_paid,
        amount_paid: sale.amount_paid,
        payment_method: (sale.payment_method || "CASH").toUpperCase(),
        previous_outstanding: sale.grand_total,
        remaining_outstanding: sale.balance_due,
        balance_amount: sale.balance_due,
        status: sale.balance_due <= 0 ? "Cleared" : "Partial",
        payment_status: sale.balance_due <= 0 ? "Cleared" : "Partial",
        recorded_by: user?.name || "Shop Admin",
        notes: "Initial payment at bill creation",
        created_at: now()
      });
    }

    // Record in audit log
    this.db.invoice_audit_logs = this.db.invoice_audit_logs || [];
    this.db.invoice_audit_logs.push({
      id: id(),
      invoice_number: sale.invoice_number,
      action: "INVOICE_CREATED",
      performed_by: user?.name || "Shop Admin",
      reason: "Sale transaction recorded",
      details: {
        grand_total: sale.grand_total,
        amount_paid: sale.amount_paid,
        balance_due: sale.balance_due,
        payment_status: paymentStatus
      },
      created_at: now()
    });

    await this.persist();
    return this.getSale(sale.id);
  }

  async cancelSale(saleId, reason = "Cancelled by admin", user) {
    const saleIndex = this.db.sales.findIndex(s => s.id === saleId || s.invoice_number === saleId);
    if (saleIndex === -1) throw Object.assign(new Error("Invoice not found"), { status: 404 });
    const sale = this.db.sales[saleIndex];
    if (sale.status === "CANCELLED") throw Object.assign(new Error("Invoice is already cancelled"), { status: 400 });

    sale.status = "CANCELLED";
    sale.cancellation_reason = reason;
    sale.cancelled_at = now();
    sale.cancelled_by = user?.name || "Admin";
    this.db.sales[saleIndex] = sale;

    // Restore stock
    const saleItems = this.db.sale_items.filter(item => item.sale_id === sale.id);
    for (const item of saleItems) {
      await this.adjustStock(item.product_id, {
        qty: Number(item.qty || 0),
        type: "sale_cancellation",
        note: `Cancelled Invoice ${sale.invoice_number}`
      }, user);
      if (item.batch_number && this.db.product_batches) {
        const batch = this.db.product_batches.find(b => b.batch_number === item.batch_number);
        if (batch) {
          batch.current_stock = round(Number(batch.current_stock || 0) + Number(item.qty || 0));
        }
      }
    }

    // Revert credit from customer pending balance
    if (sale.customer_id && sale.balance_due > 0) {
      const custIdx = this.db.customers.findIndex(c => c.id === sale.customer_id);
      if (custIdx >= 0) {
        this.db.customers[custIdx].pending_balance = Math.max(0, round(Number(this.db.customers[custIdx].pending_balance || 0) - sale.balance_due));
        this.db.customers[custIdx].credit_amount = this.db.customers[custIdx].pending_balance;
      }
      if (this.db.farmer_credit_ledger) {
        this.db.farmer_credit_ledger = this.db.farmer_credit_ledger.map(entry => {
          if (entry.sale_id === sale.id || entry.invoice_id === sale.invoice_number) {
            return { ...entry, status: "CANCELLED", outstanding_principal: 0, note: "Invoice cancelled" };
          }
          return entry;
        });
      }
    }

    this.db.invoice_audit_logs = this.db.invoice_audit_logs || [];
    this.db.invoice_audit_logs.push({
      id: id(),
      invoice_number: sale.invoice_number,
      action: "INVOICE_CANCELLED",
      performed_by: user?.name || "Admin",
      reason,
      created_at: now()
    });

    await this.persist();
    return this.getSale(sale.id);
  }

  async logDigitalDelivery(delivery) {
    this.db.digital_deliveries = this.db.digital_deliveries || [];
    const record = {
      id: id(),
      sale_id: delivery.sale_id || "",
      invoice_number: delivery.invoice_number,
      channel: delivery.channel,
      recipient: delivery.recipient,
      status: delivery.status,
      message_id: delivery.message_id || "",
      error_message: delivery.error || "",
      details: delivery.details || "",
      created_at: now()
    };
    this.db.digital_deliveries.push(record);

    const sale = this.db.sales.find(s => s.id === delivery.sale_id || s.invoice_number === delivery.invoice_number);
    if (sale) {
      if (delivery.channel === "whatsapp") sale.whatsapp_status = delivery.status;
      if (delivery.channel === "email") sale.email_status = delivery.status;
    }

    await this.persist();
    return record;
  }

  async listDigitalDeliveries(query = {}) {
    let list = this.db.digital_deliveries || [];
    if (query.invoice_number) {
      list = list.filter(d => d.invoice_number === query.invoice_number);
    }
    return list.slice().reverse();
  }

  async listAuditLogs(invoiceNumber) {
    let list = this.db.invoice_audit_logs || [];
    if (invoiceNumber) {
      list = list.filter(l => l.invoice_number === invoiceNumber);
    }
    return list.slice().reverse();
  }

  async listPurchases(query = {}) {
    return this.filterBySearch(this.db.purchases, query, ["invoice_number", "supplier_name"]);
  }

  async createPurchase(data, user) {
    const supplier = data.supplier_id ? await this.getById("suppliers", data.supplier_id) : null;
    const purchase = {
      id: id(),
      supplier_id: data.supplier_id || "",
      supplier_name: data.supplier_name || supplier?.name || "",
      invoice_number: data.invoice_number,
      purchase_date: data.purchase_date || today(),
      total_amount: round((data.items || []).reduce((sum, item) => sum + Number(item.total_amount || 0), 0)),
      created_by: user?.name,
      created_at: now()
    };
    this.db.purchases.push(purchase);
    for (const item of data.items || []) {
      this.db.purchase_items.push({ id: id(), purchase_id: purchase.id, ...item, created_at: now() });
      await this.adjustStock(item.product_id, { qty: Number(item.qty || 0), type: "purchase", note: purchase.invoice_number }, user);
      const product = await this.getById("products", item.product_id);
      if (product) {
        product.purchase_price = Number(item.purchase_rate || product.purchase_price);
      }
    }
    await this.persist();
    return { ...purchase, items: this.db.purchase_items.filter((item) => item.purchase_id === purchase.id) };
  }

  async getPurchase(id) {
    const purchase = this.db.purchases.find((p) => p.id === id);
    if (!purchase) return null;
    return {
      ...purchase,
      items: this.db.purchase_items.filter((item) => item.purchase_id === id)
    };
  }

  async updatePurchase(purchaseId, data, user) {
    const purchaseIndex = this.db.purchases.findIndex((p) => p.id === purchaseId);
    if (purchaseIndex === -1) throw new Error("Purchase not found");
    const oldPurchase = this.db.purchases[purchaseIndex];

    // 1. Revert previous purchase items from stock
    const oldItems = this.db.purchase_items.filter((item) => item.purchase_id === purchaseId);
    for (const item of oldItems) {
      await this.adjustStock(item.product_id, { qty: -Number(item.qty || 0), type: "purchase_reversal", note: `Revert ${oldPurchase.invoice_number}` }, user);
    }
    this.db.purchase_items = this.db.purchase_items.filter((item) => item.purchase_id !== purchaseId);

    // 2. Update purchase record
    const supplier = data.supplier_id ? await this.getById("suppliers", data.supplier_id) : null;
    const updatedPurchase = {
      ...oldPurchase,
      supplier_id: data.supplier_id || oldPurchase.supplier_id,
      supplier_name: data.supplier_name || supplier?.name || oldPurchase.supplier_name,
      invoice_number: data.invoice_number || oldPurchase.invoice_number,
      purchase_date: data.purchase_date || oldPurchase.purchase_date,
      total_amount: round((data.items || []).reduce((sum, item) => sum + Number(item.total_amount || 0), 0)),
      updated_at: now()
    };
    this.db.purchases[purchaseIndex] = updatedPurchase;

    // 3. Add new items & adjust stock
    for (const item of data.items || []) {
      this.db.purchase_items.push({ id: id(), purchase_id: purchaseId, ...item, created_at: now() });
      await this.adjustStock(item.product_id, { qty: Number(item.qty || 0), type: "purchase", note: updatedPurchase.invoice_number }, user);
      const product = await this.getById("products", item.product_id);
      if (product && item.purchase_rate) {
        product.purchase_price = Number(item.purchase_rate);
      }
    }

    await this.persist();
    return { ...updatedPurchase, items: this.db.purchase_items.filter((item) => item.purchase_id === purchaseId) };
  }

  async deletePurchase(purchaseId, user) {
    const purchase = this.db.purchases.find((p) => p.id === purchaseId);
    if (!purchase) return false;

    // Revert stock additions
    const items = this.db.purchase_items.filter((item) => item.purchase_id === purchaseId);
    for (const item of items) {
      await this.adjustStock(item.product_id, { qty: -Number(item.qty || 0), type: "purchase_deletion", note: `Delete ${purchase.invoice_number}` }, user);
    }

    this.db.purchases = this.db.purchases.filter((p) => p.id !== purchaseId);
    this.db.purchase_items = this.db.purchase_items.filter((item) => item.purchase_id !== purchaseId);
    await this.persist();
    return true;
  }

  async resetAll(preserveCatalog = true) {
    this.db.sales = [];
    this.db.sale_items = [];
    this.db.purchases = [];
    this.db.purchase_items = [];
    this.db.payments = [];
    this.db.stock_logs = [];

    for (const cust of this.db.customers || []) {
      cust.pending_balance = 0;
      cust.credit_amount = 0;
    }
    for (const sup of this.db.suppliers || []) {
      sup.outstanding_amount = 0;
    }
    if (preserveCatalog) {
      for (const prod of this.db.products || []) {
        prod.current_stock = 0;
      }
    } else {
      this.db.products = [];
    }
    await this.persist();
    return true;
  }

  async resetPurchases() {
    this.db.purchases = [];
    this.db.purchase_items = [];
    for (const prod of this.db.products || []) {
      prod.current_stock = 0;
    }
    for (const sup of this.db.suppliers || []) {
      sup.outstanding_amount = 0;
    }
    await this.persist();
    return true;
  }

  async resetSales() {
    this.db.sales = [];
    this.db.sale_items = [];
    this.db.payments = [];
    this.db.farmer_credit_ledger = [];
    this.db.credit_payments = [];
    this.db.interest_history = [];
    for (const cust of this.db.customers || []) {
      cust.pending_balance = 0;
      cust.credit_amount = 0;
    }
    await this.persist();
    return true;
  }

  async createPayment(data, user) {
    const customerId = data.customer_id || data.farmer_id || "";
    const customer = customerId ? await this.getById("customers", customerId) : null;
    const customerName = data.customer_name || data.farmer_name || customer?.name || "Walk-in Customer";
    const previousOutstanding = round(Number(customer ? customer.pending_balance : (data.previous_outstanding || 0)));
    const amountPaid = round(Number(data.amount || data.amount_paid || 0));

    if (amountPaid <= 0) {
      throw Object.assign(new Error("Payment amount must be greater than zero."), { status: 400 });
    }

    if (previousOutstanding > 0 && amountPaid > previousOutstanding + 0.01) {
      throw Object.assign(new Error("Payment amount cannot exceed the current outstanding balance."), { status: 400 });
    }

    const remainingOutstanding = round(Math.max(0, previousOutstanding - amountPaid));
    const isCleared = remainingOutstanding <= 0;

    const paymentTime = data.payment_time || new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    const paymentDate = data.payment_date || today();

    const payCount = (this.db.payments || []).length + 1;
    const paymentId = data.payment_id || nextNumber("PAY", payCount);

    const payment = {
      id: id(),
      payment_id: paymentId,
      customer_id: customerId,
      customer_name: customerName,
      farmer_id: customerId,
      farmer_name: customerName,
      sale_id: data.sale_id || "",
      bill_number: data.bill_number || data.invoice_id || data.invoice_number || (data.sale_id ? (this.db.sales.find(s => s.id === data.sale_id)?.invoice_number || "") : "CREDIT-LEDGER"),
      invoice_id: data.bill_number || data.invoice_id || data.invoice_number || "CREDIT-LEDGER",
      bill_date: data.bill_date || paymentDate,
      payment_date: paymentDate,
      payment_time: paymentTime,
      amount: amountPaid,
      amount_paid: amountPaid,
      payment_method: (data.payment_method || data.method || "CASH").toUpperCase(),
      previous_outstanding: previousOutstanding,
      remaining_outstanding: remainingOutstanding,
      balance_amount: remainingOutstanding,
      status: isCleared ? "Cleared" : "Partial",
      payment_status: isCleared ? "Cleared" : "Partial",
      recorded_by: user?.name || "Shop Admin",
      notes: data.notes || data.note || data.remarks || "",
      created_at: now()
    };

    this.db.payments.push(payment);

    if (customer) {
      customer.pending_balance = remainingOutstanding;
      customer.credit_amount = remainingOutstanding;

      if (this.db.farmer_credit_ledger) {
        let unallocated = amountPaid;
        for (const ledger of this.db.farmer_credit_ledger) {
          if ((ledger.customer_id === customer.id || ledger.farmer_id === customer.id) && Number(ledger.outstanding_principal || 0) > 0) {
            const payTowards = Math.min(Number(ledger.outstanding_principal || 0), unallocated);
            ledger.outstanding_principal = round(Number(ledger.outstanding_principal) - payTowards);
            ledger.amount_paid = round(Number(ledger.amount_paid || 0) + payTowards);
            ledger.status = ledger.outstanding_principal <= 0 ? "CLEARED" : "PARTIAL";
            unallocated = round(unallocated - payTowards);
            if (unallocated <= 0) break;
          }
        }
      }
    }

    if (data.sale_id || data.bill_number || data.invoice_id) {
      const sale = this.db.sales.find(s => s.id === data.sale_id || s.invoice_number === (data.bill_number || data.invoice_id));
      if (sale) {
        sale.amount_paid = round(Number(sale.amount_paid || 0) + amountPaid);
        sale.balance_due = round(Math.max(0, Number(sale.grand_total || 0) - sale.amount_paid));
      }
    }

    await this.persist();
    return payment;
  }

  async stockLogs(query = {}) {
    return this.filterBySearch(this.db.stock_logs, query, ["product_name", "type", "note"]);
  }

  async dashboard() {
    const todayDate = today();
    const month = todayDate.slice(0, 7);
    const todaySales = sum(this.db.sales.filter((sale) => sale.date === todayDate), "grand_total");
    const monthlySales = sum(this.db.sales.filter((sale) => String(sale.date).startsWith(month)), "grand_total");
    const purchaseAmount = sum(this.db.purchases.filter((purchase) => String(purchase.purchase_date).startsWith(month)), "total_amount");
    const totalStockValue = round(this.db.products.reduce((sumValue, product) => sumValue + Number(product.current_stock || 0) * Number(product.purchase_price || 0), 0));
    const lowStock = this.db.products.filter((product) => Number(product.current_stock || 0) <= Number(product.minimum_stock_alert || 0));
    const pendingDues = round(sum(this.db.customers, "pending_balance"));
    const gstSummary = {
      cgst: round(sum(this.db.sales, "cgst")),
      sgst: round(sum(this.db.sales, "sgst")),
      purchase_tax: round(this.db.purchase_items.reduce((total, item) => total + Number(item.gst || 0), 0))
    };
    const topProducts = Object.values(this.db.sale_items.reduce((acc, item) => {
      acc[item.product_id] ||= { product_name: item.product_name, qty: 0, amount: 0 };
      acc[item.product_id].qty += Number(item.qty || 0);
      acc[item.product_id].amount += Number(item.total || 0);
      return acc;
    }, {})).sort((a, b) => b.qty - a.qty).slice(0, 5);
    const predictions = await predictionEngine.getLatestPredictions(this);
    return { todaySales, monthlySales, purchaseAmount, totalStockValue, lowStock, pendingDues, gstSummary, topProducts, predictions };
  }

  async report(type, query = {}) {
    const from = query.from || "0000-01-01";
    const to = query.to || "9999-12-31";
    const between = (date) => String(date) >= from && String(date) <= to;
    const rows = {
      "sales-register": this.db.sales.filter((sale) => between(sale.date)),
      "purchase-register": this.db.purchases.filter((purchase) => between(purchase.purchase_date)),
      "gst-summary": this.db.sales.filter((sale) => between(sale.date)).map(({ invoice_number, date, taxable = 0, subtotal, cgst, sgst, grand_total }) => ({ invoice_number, date, taxable: taxable || subtotal, cgst, sgst, grand_total })),
      "cgst": this.db.sales.filter((sale) => between(sale.date)).map(({ invoice_number, date, cgst }) => ({ invoice_number, date, cgst })),
      "sgst": this.db.sales.filter((sale) => between(sale.date)).map(({ invoice_number, date, sgst }) => ({ invoice_number, date, sgst })),
      "hsn": this.db.sale_items.map(({ hsn_code, product_name, gst_percent, total }) => ({ hsn_code, product_name, gst_percent, total })),
      "date-wise-invoices": this.db.sales.filter((sale) => between(sale.date)),
      "taxable": this.db.sale_items.map((item) => ({ product_name: item.product_name, gst_percent: item.gst_percent, taxable: Number(item.total || 0) - Number(item.cgst || 0) - Number(item.sgst || 0), total: item.total }))
    }[type] || [];
    return { type, rows };
  }

  async getCreditSettings() {
    this.db.credit_settings = this.db.credit_settings || [];
    if (this.db.credit_settings.length === 0) {
      this.db.credit_settings.push({
        id: "default",
        interest_enabled: true,
        monthly_interest_rate: 2.0,
        calculation_type: "simple",
        grace_period_days: 0,
        calculation_day: 1,
        payment_allocation_policy: "principal_first",
        default_credit_due_days: 30,
        expiry_alerts_enabled: true,
        alert_periods: "90,60,30,15,7,0",
        admin_notification_email: "harshavardhanjunji@gmail.com",
        admin_notification_whatsapp: "+918660548244",
        customer_bill_whatsapp_enabled: true,
        customer_bill_email_enabled: true,
        admin_expiry_email_enabled: true,
        admin_expiry_whatsapp_enabled: true,
        updated_at: now()
      });
      await this.persist();
    }
    return this.db.credit_settings[0];
  }

  async updateCreditSettings(data) {
    const current = await this.getCreditSettings();
    this.db.credit_settings[0] = { ...current, ...data, updated_at: now() };
    await this.persist();
    return this.db.credit_settings[0];
  }

  async listBatches(query = {}) {
    const todayMs = new Date().setHours(0, 0, 0, 0);
    this.db.product_batches = this.db.product_batches || [];

    const list = this.db.product_batches.map((batch) => {
      let daysRemaining = null;
      let expiryStatus = "ACTIVE";
      if (batch.expiry_date) {
        const expMs = new Date(batch.expiry_date).getTime();
        daysRemaining = Math.ceil((expMs - todayMs) / 86400000);
        if (daysRemaining <= 0) {
          expiryStatus = "EXPIRED";
        } else if (daysRemaining <= 30) {
          expiryStatus = "CRITICAL";
        } else if (daysRemaining <= 60) {
          expiryStatus = "WARNING";
        } else if (daysRemaining <= 90) {
          expiryStatus = "DUE_SOON";
        } else {
          expiryStatus = "GOOD";
        }
      }
      return {
        ...batch,
        days_remaining: daysRemaining,
        expiry_status: expiryStatus
      };
    });

    if (query.status && query.status !== "ALL") {
      return list.filter((b) => b.expiry_status === query.status || b.status === query.status);
    }

    return this.filterBySearch(list, query, ["product_name", "batch_number", "supplier_name", "expiry_status"]);
  }

  async createBatch(data, user) {
    this.db.product_batches = this.db.product_batches || [];
    const stock = Number(data.initial_stock || data.current_stock || 0);
    const batch = {
      id: id(),
      product_id: data.product_id || "",
      product_name: data.product_name || "",
      batch_number: data.batch_number || `BAT-${Date.now().toString().slice(-6)}`,
      purchase_date: data.purchase_date || today(),
      mfg_date: data.mfg_date || "",
      expiry_date: data.expiry_date || "",
      initial_stock: stock,
      current_stock: stock,
      unit: data.unit || "Bag",
      purchase_price: Number(data.purchase_price || 0),
      selling_price: Number(data.selling_price || 0),
      supplier_name: data.supplier_name || "Direct Supplier",
      status: "ACTIVE",
      created_at: now(),
      updated_at: now()
    };
    this.db.product_batches.push(batch);

    // Sync to product
    if (batch.product_id) {
      await this.adjustStock(batch.product_id, {
        qty: stock,
        type: "batch_addition",
        note: `Batch ${batch.batch_number} added`
      }, user);
    }

    await this.persist();
    return batch;
  }

  async updateBatch(batchId, data) {
    this.db.product_batches = this.db.product_batches || [];
    const idx = this.db.product_batches.findIndex(b => b.id === batchId);
    if (idx < 0) throw Object.assign(new Error("Batch not found"), { status: 404 });
    this.db.product_batches[idx] = { ...this.db.product_batches[idx], ...data, updated_at: now() };
    await this.persist();
    return this.db.product_batches[idx];
  }

  async deleteBatch(batchId) {
    this.db.product_batches = (this.db.product_batches || []).filter(b => b.id !== batchId);
    await this.persist();
    return true;
  }

  async listCustomerInterestHistory(customerId) {
    this.db.interest_history = this.db.interest_history || [];
    if (customerId) {
      return this.db.interest_history
        .filter(h => h.customer_id === customerId)
        .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
    }
    return this.db.interest_history.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
  }

  async recordInterestEntry(record) {
    this.db.interest_history = this.db.interest_history || [];
    const entry = { id: id(), ...record, created_at: now() };
    this.db.interest_history.push(entry);

    if (record.customer_id) {
      const cust = this.db.customers.find(c => c.id === record.customer_id);
      if (cust) {
        cust.pending_balance = record.total_balance_after;
        cust.credit_amount = record.total_balance_after;
      }
    }
    await this.persist();
    return entry;
  }

  async listExpiryAlertHistory() {
    this.db.expiry_alert_history = this.db.expiry_alert_history || [];
    return this.db.expiry_alert_history.sort((a, b) => String(b.sent_at || "").localeCompare(String(a.sent_at || "")));
  }

  async recordExpiryAlert(record) {
    this.db.expiry_alert_history = this.db.expiry_alert_history || [];
    const entry = { id: id(), ...record, sent_at: record.sent_at || now() };
    this.db.expiry_alert_history.push(entry);
    await this.persist();
    return entry;
  }

  filterBySearch(rows, query, keys) {
    const term = String(query.search || "").toLowerCase();
    return rows
      .filter((row) => !term || keys.some((key) => String(row[key] ?? "").toLowerCase().includes(term)))
      .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
  }
}

function id() {
  return randomUUID();
}

function now() {
  return new Date().toISOString();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nextNumber(prefix, number) {
  return `${prefix}-${new Date().getFullYear()}-${String(number).padStart(5, "0")}`;
}

function sum(rows, key) {
  return round(rows.reduce((total, row) => total + Number(row[key] || 0), 0));
}
