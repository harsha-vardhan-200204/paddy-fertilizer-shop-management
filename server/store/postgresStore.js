import pg from "pg";
import { randomUUID } from "crypto";
import { round } from "../utils/reports.js";
import { predictionEngine } from "../services/predictionEngine.js";
import { getFinancialYear, formatInvoiceNumber } from "../utils/invoiceNumber.js";

const { Pool } = pg;

export class PostgresStore {
  kind = "postgres";

  constructor(connectionString) {
    this.pool = new Pool({
      connectionString,
      ssl: connectionString.includes("supabase") ? { rejectUnauthorized: false } : undefined
    });
  }

  async init() {
    return this.health();
  }

  async health() {
    try {
      await this.pool.query("select 1");
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: readableDatabaseError(error)
      };
    }
  }

  async findUser(username) {
    return this.one("select * from users where username = $1", [username]);
  }

  async list(resource, query = {}) {
    assertTable(resource);
    const term = `%${query.search || ""}%`;
    const searchable = searchColumns[resource] || ["name"];
    const where = query.search
      ? `where ${searchable.map((column, index) => `${column}::text ilike $${index + 1}`).join(" or ")}`
      : "";
    const values = query.search ? searchable.map(() => term) : [];
    return this.many(`select * from ${resource} ${where} order by created_at desc nulls last`, values);
  }

  async getById(resource, id) {
    assertTable(resource);
    return this.one(`select * from ${resource} where id = $1`, [id]);
  }

  async create(resource, data) {
    assertTable(resource);
    const record = { id: randomUUID(), ...data };
    const keys = Object.keys(record);
    const placeholders = keys.map((_, index) => `$${index + 1}`);
    const result = await this.pool.query(
      `insert into ${resource} (${keys.join(",")}) values (${placeholders.join(",")}) returning *`,
      keys.map((key) => record[key])
    );
    return result.rows[0];
  }

  async update(resource, id, data) {
    assertTable(resource);
    const keys = Object.keys(data);
    const sets = keys.map((key, index) => `${key} = $${index + 1}`);
    const result = await this.pool.query(
      `update ${resource} set ${sets.join(",")}, updated_at = now() where id = $${keys.length + 1} returning *`,
      [...keys.map((key) => data[key]), id]
    );
    if (!result.rows[0]) throw Object.assign(new Error("Record not found"), { status: 404 });
    return result.rows[0];
  }

  async remove(resource, id) {
    assertTable(resource);
    await this.pool.query(`delete from ${resource} where id = $1`, [id]);
  }

  async adjustStock(productId, data, user) {
    const qty = Number(data.qty || 0);
    const product = await this.one(
      "update products set current_stock = current_stock + $1, updated_at = now() where id = $2 returning *",
      [qty, productId]
    );
    if (!product) throw Object.assign(new Error("Product not found"), { status: 404 });
    await this.create("stock_logs", {
      product_id: productId,
      product_name: product.name,
      type: data.type || "adjustment",
      qty,
      note: data.note || "",
      created_by: user?.name
    });
    return product;
  }

  async listSales(query = {}) {
    return this.list("sales", query);
  }

  async getSale(id) {
    const sale = await this.one("select * from sales where id = $1 or invoice_number = $1", [id]);
    if (!sale) return null;
    sale.items = await this.many("select * from sale_items where sale_id = $1", [sale.id]);
    return sale;
  }

  async createSale(data, user) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");

      // Strict Product Expiry Validation: Block expired stock from sales
      const todayDate = today();
      for (const item of data.items || []) {
        if (item.product_id) {
          const prodRes = await client.query("select name, expiry_date, batch_number from products where id = $1", [item.product_id]);
          const prod = prodRes.rows[0];
          let expDate = prod?.expiry_date;
          if (item.batch_number) {
            const bRes = await client.query("select expiry_date from product_batches where batch_number = $1 limit 1", [item.batch_number]);
            if (bRes.rows[0]?.expiry_date) expDate = bRes.rows[0].expiry_date;
          }
          if (expDate && String(expDate) < todayDate) {
            throw Object.assign(
              new Error(`Strict Regulatory Warning: Stock for '${item.product_name || prod?.name}' (Batch: ${item.batch_number || prod?.batch_number || 'N/A'}) EXPIRED on ${expDate}. Selling expired agricultural inputs is strictly prohibited.`),
              { status: 400 }
            );
          }
        }
      }

      const invoiceNumber = data.invoice_number || await this.nextInvoiceNumber(client, data.date || today());
      const customer = data.customer_id ? await client.query("select * from customers where id = $1", [data.customer_id]) : { rows: [] };
      const c = customer.rows[0] || {};

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

      const sale = await client.query(
        `insert into sales (
          id, invoice_number, date, customer_id, customer_name, mobile, customer_email,
          village, billing_address, gstin, customer_aadhaar, subtotal, cgst, sgst, igst,
          total_tax, round_off, grand_total, amount_paid, balance_due, payment_method,
          payment_status, status, is_interstate, state_of_supply, due_date, pdf_path,
          created_by
        ) values (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28
        ) returning *`,
        [
          randomUUID(),
          invoiceNumber,
          pDate,
          data.customer_id || null,
          data.customer_name || c.name || "",
          data.mobile || c.mobile || "",
          data.customer_email || data.email || c.email || "",
          data.village || c.village || "",
          data.billing_address || c.address || "",
          data.gstin || "",
          data.customer_aadhaar || data.aadhaar_number || c.aadhaar || "",
          round(data.subtotal),
          round(data.cgst),
          round(data.sgst),
          round(data.igst || 0),
          round(data.total_tax || (Number(data.cgst || 0) + Number(data.sgst || 0) + Number(data.igst || 0))),
          round(data.round_off || 0),
          grandTotal,
          amountPaid,
          balanceDue,
          data.payment_method || "Cash",
          paymentStatus,
          "ISSUED",
          Boolean(data.is_interstate),
          data.state_of_supply || "29 - Karnataka",
          dueDate,
          data.pdf_path || "",
          user?.name || "Shop Admin"
        ]
      );

      for (const item of data.items || []) {
        await client.query(
          `insert into sale_items (
            id, sale_id, product_id, product_name, hsn_code, unit, qty, rate, discount,
            taxable_amount, gst_percent, cgst, sgst, igst, total
          ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
          [
            randomUUID(),
            sale.rows[0].id,
            item.product_id,
            item.product_name || item.name,
            item.hsn_code,
            item.unit || "Bag",
            item.qty,
            item.rate,
            item.discount || 0,
            item.taxable_amount ?? (item.qty * item.rate - (item.discount || 0)),
            item.gst_percent,
            item.cgst || 0,
            item.sgst || 0,
            item.igst || 0,
            item.total
          ]
        );

        const qty = Number(item.qty || 0);
        const stock = await client.query(
          "update products set current_stock = coalesce(current_stock, 0) - $1, updated_at = now() where id = $2 returning name",
          [qty, item.product_id]
        );
        if (!stock.rows[0]) throw Object.assign(new Error(`Product not found for stock update: ${item.product_name || item.product_id}`), { status: 404 });
        await client.query(
          "insert into stock_logs (id, product_id, product_name, type, qty, note, created_by) values ($1,$2,$3,$4,$5,$6,$7)",
          [randomUUID(), item.product_id, item.product_name || stock.rows[0].name, "sale", -qty, invoiceNumber, user?.name]
        );
      }

      if (data.customer_id && sale.rows[0].balance_due > 0) {
        await client.query(
          "update customers set pending_balance = coalesce(pending_balance,0) + $1, credit_amount = coalesce(credit_amount,0) + $1 where id = $2",
          [sale.rows[0].balance_due, data.customer_id]
        );
        await client.query(
          `insert into farmer_credit_ledger (
            id, customer_id, farmer_id, farmer_name, mobile, village, invoice_id, sale_id,
            purchase_date, due_date, credit_amount, principal_amount, outstanding_principal,
            amount_paid, interest_rate, credit_due_days, status
          ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
          [
            randomUUID(),
            data.customer_id,
            data.customer_id,
            data.customer_name || c.name || "",
            data.mobile || c.mobile || "",
            data.village || c.village || "",
            invoiceNumber,
            sale.rows[0].id,
            pDate,
            dueDate,
            sale.rows[0].balance_due,
            sale.rows[0].balance_due,
            sale.rows[0].balance_due,
            0,
            interestRate,
            creditDays,
            "PENDING"
          ]
        );
      }

      // Record in audit log
      await client.query(
        `insert into invoice_audit_logs (id, invoice_number, action, performed_by, reason, details)
         values ($1,$2,$3,$4,$5,$6)`,
        [
          randomUUID(),
          invoiceNumber,
          "INVOICE_CREATED",
          user?.name || "Shop Admin",
          "Sale transaction recorded",
          JSON.stringify({ grand_total: grandTotal, amount_paid: amountPaid, balance_due: balanceDue, payment_status: paymentStatus })
        ]
      );

      await client.query("commit");
      return this.getSale(sale.rows[0].id);
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async cancelSale(saleId, reason = "Cancelled by admin", user) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const saleRes = await client.query("select * from sales where id = $1 or invoice_number = $1", [saleId]);
      if (!saleRes.rows[0]) throw Object.assign(new Error("Invoice not found"), { status: 404 });
      const sale = saleRes.rows[0];
      if (sale.status === "CANCELLED") throw Object.assign(new Error("Invoice is already cancelled"), { status: 400 });

      // Mark cancelled
      await client.query(
        "update sales set status = 'CANCELLED', cancellation_reason = $1, cancelled_at = now(), cancelled_by = $2 where id = $3",
        [reason, user?.name || "Admin", sale.id]
      );

      // Revert items to stock
      const items = await client.query("select * from sale_items where sale_id = $1", [sale.id]);
      for (const item of items.rows) {
        await client.query(
          "update products set current_stock = coalesce(current_stock, 0) + $1, updated_at = now() where id = $2",
          [Number(item.qty || 0), item.product_id]
        );
        await client.query(
          "insert into stock_logs (id, product_id, product_name, type, qty, note, created_by) values ($1,$2,$3,$4,$5,$6,$7)",
          [randomUUID(), item.product_id, item.product_name, "sale_cancellation", Number(item.qty || 0), `Cancelled Invoice ${sale.invoice_number}`, user?.name]
        );
      }

      // Revert customer credit
      if (sale.customer_id && sale.balance_due > 0) {
        await client.query(
          "update customers set pending_balance = greatest(0, coalesce(pending_balance, 0) - $1), credit_amount = greatest(0, coalesce(credit_amount, 0) - $1) where id = $2",
          [sale.balance_due, sale.customer_id]
        );
        await client.query(
          "update farmer_credit_ledger set status = 'CANCELLED', outstanding_principal = 0 where sale_id = $1 or invoice_id = $2",
          [sale.id, sale.invoice_number]
        );
      }

      // Audit log
      await client.query(
        "insert into invoice_audit_logs (id, invoice_number, action, performed_by, reason) values ($1,$2,$3,$4,$5)",
        [randomUUID(), sale.invoice_number, "INVOICE_CANCELLED", user?.name || "Admin", reason]
      );

      await client.query("commit");
      return this.getSale(sale.id);
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async logDigitalDelivery(delivery) {
    const client = await this.pool.connect();
    try {
      const res = await client.query(
        `insert into digital_deliveries (id, sale_id, invoice_number, channel, recipient, status, message_id, error_message, details)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *`,
        [
          randomUUID(),
          delivery.sale_id || null,
          delivery.invoice_number,
          delivery.channel,
          delivery.recipient,
          delivery.status,
          delivery.message_id || null,
          delivery.error || null,
          delivery.details || null
        ]
      );
      if (delivery.channel === "whatsapp") {
        await client.query("update sales set whatsapp_status = $1 where invoice_number = $2 or id = $3", [delivery.status, delivery.invoice_number, delivery.sale_id]);
      } else if (delivery.channel === "email") {
        await client.query("update sales set email_status = $1 where invoice_number = $2 or id = $3", [delivery.status, delivery.invoice_number, delivery.sale_id]);
      }
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async listDigitalDeliveries(query = {}) {
    if (query.invoice_number) {
      return this.many("select * from digital_deliveries where invoice_number = $1 order by created_at desc", [query.invoice_number]);
    }
    return this.many("select * from digital_deliveries order by created_at desc limit 100");
  }

  async listAuditLogs(invoiceNumber) {
    if (invoiceNumber) {
      return this.many("select * from invoice_audit_logs where invoice_number = $1 order by created_at desc", [invoiceNumber]);
    }
    return this.many("select * from invoice_audit_logs order by created_at desc limit 100");
  }

  async listPurchases(query = {}) {
    return this.list("purchases", query);
  }

  async createPurchase(data, user) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const purchase = await client.query(
        `insert into purchases (id, supplier_id, supplier_name, invoice_number, purchase_date, total_amount, created_by)
         values ($1,$2,$3,$4,$5,$6,$7) returning *`,
        [randomUUID(), data.supplier_id || null, data.supplier_name || "", data.invoice_number, data.purchase_date || today(), round((data.items || []).reduce((total, item) => total + Number(item.total_amount || 0), 0)), user?.name]
      );
      for (const item of data.items || []) {
        await client.query(
          `insert into purchase_items (id, purchase_id, product_id, qty, purchase_rate, gst, total_amount)
           values ($1,$2,$3,$4,$5,$6,$7)`,
          [randomUUID(), purchase.rows[0].id, item.product_id, item.qty, item.purchase_rate, item.gst, item.total_amount]
        );
        const qty = Number(item.qty || 0);
        const stock = await client.query(
          "update products set current_stock = coalesce(current_stock, 0) + $1, purchase_price = coalesce($2, purchase_price), updated_at = now() where id = $3 returning name",
          [qty, item.purchase_rate === undefined || item.purchase_rate === "" ? null : Number(item.purchase_rate), item.product_id]
        );
        if (!stock.rows[0]) throw Object.assign(new Error(`Product not found for stock update: ${item.product_id}`), { status: 404 });
        await client.query("insert into stock_logs (id, product_id, product_name, type, qty, note, created_by) values ($1,$2,$3,$4,$5,$6,$7)", [randomUUID(), item.product_id, stock.rows[0].name, "purchase", qty, purchase.rows[0].invoice_number, user?.name]);
      }
      await client.query("commit");
      return this.getPurchase(purchase.rows[0].id);
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async getPurchase(id) {
    const purchase = await this.one("select * from purchases where id = $1", [id]);
    if (!purchase) return null;
    purchase.items = await this.many("select * from purchase_items where purchase_id = $1", [purchase.id]);
    return purchase;
  }

  async updatePurchase(purchaseId, data, user) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const oldItems = await client.query("select * from purchase_items where purchase_id = $1", [purchaseId]);
      for (const item of oldItems.rows) {
        await client.query("update products set current_stock = coalesce(current_stock,0) - $1 where id = $2", [Number(item.qty || 0), item.product_id]);
      }
      await client.query("delete from purchase_items where purchase_id = $1", [purchaseId]);

      const supplier = data.supplier_id ? await this.one("select name from suppliers where id = $1", [data.supplier_id]) : null;
      const totalAmount = round((data.items || []).reduce((sum, item) => sum + Number(item.total_amount || 0), 0));
      await client.query(
        "update purchases set supplier_id = $1, supplier_name = $2, invoice_number = $3, purchase_date = $4, total_amount = $5, updated_at = now() where id = $6",
        [data.supplier_id || null, data.supplier_name || supplier?.name || "", data.invoice_number, data.purchase_date, totalAmount, purchaseId]
      );

      for (const item of data.items || []) {
        const qty = Number(item.qty || 0);
        await client.query(
          "insert into purchase_items (id, purchase_id, product_id, qty, purchase_rate, gst, total_amount) values ($1,$2,$3,$4,$5,$6,$7)",
          [randomUUID(), purchaseId, item.product_id, qty, item.purchase_rate, item.gst || 0, item.total_amount]
        );
        await client.query("update products set current_stock = coalesce(current_stock,0) + $1, purchase_price = $2 where id = $3", [qty, item.purchase_rate, item.product_id]);
      }
      await client.query("commit");
      return this.getPurchase(purchaseId);
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async deletePurchase(purchaseId, user) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const oldItems = await client.query("select * from purchase_items where purchase_id = $1", [purchaseId]);
      for (const item of oldItems.rows) {
        await client.query("update products set current_stock = coalesce(current_stock,0) - $1 where id = $2", [Number(item.qty || 0), item.product_id]);
      }
      await client.query("delete from purchases where id = $1", [purchaseId]);
      await client.query("commit");
      return true;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async resetAll(preserveCatalog = true) {
    await this.pool.query("truncate table sale_items, sales, purchase_items, purchases, payments, stock_logs cascade");
    await this.pool.query("update customers set pending_balance = 0, credit_amount = 0");
    await this.pool.query("update suppliers set outstanding_amount = 0");
    if (preserveCatalog) {
      await this.pool.query("update products set current_stock = 0");
    } else {
      await this.pool.query("delete from products");
    }
    return true;
  }

  async resetPurchases() {
    await this.pool.query("truncate table purchase_items, purchases cascade");
    await this.pool.query("update products set current_stock = 0");
    await this.pool.query("update suppliers set outstanding_amount = 0");
    return true;
  }

  async resetSales() {
    await this.pool.query("truncate table sale_items, sales, payments cascade");
    await this.pool.query("update customers set pending_balance = 0, credit_amount = 0");
    return true;
  }

  async createPayment(data, user) {
    const payment = await this.create("payments", { ...data, amount: Number(data.amount || 0), created_by: user?.name });
    if (data.customer_id) {
      await this.pool.query("update customers set pending_balance = coalesce(pending_balance,0) - $1, credit_amount = coalesce(credit_amount,0) - $1 where id = $2", [payment.amount, data.customer_id]);
    }
    return payment;
  }

  async stockLogs(query = {}) {
    return this.list("stock_logs", query);
  }

  async dashboard() {
    const [sales, purchases, products, customers, saleItems, purchaseItems] = await Promise.all([
      this.many("select * from sales"),
      this.many("select * from purchases"),
      this.many("select * from products"),
      this.many("select * from customers"),
      this.many("select * from sale_items"),
      this.many("select * from purchase_items")
    ]);
    const todayDate = today();
    const month = todayDate.slice(0, 7);
    return {
      todaySales: sum(sales.filter((sale) => String(sale.date).slice(0, 10) === todayDate), "grand_total"),
      monthlySales: sum(sales.filter((sale) => String(sale.date).slice(0, 7) === month), "grand_total"),
      purchaseAmount: sum(purchases.filter((purchase) => String(purchase.purchase_date).slice(0, 7) === month), "total_amount"),
      totalStockValue: round(products.reduce((value, product) => value + Number(product.current_stock || 0) * Number(product.purchase_price || 0), 0)),
      lowStock: products.filter((product) => Number(product.current_stock || 0) <= Number(product.minimum_stock_alert || 0)),
      pendingDues: sum(customers, "pending_balance"),
      gstSummary: { cgst: sum(sales, "cgst"), sgst: sum(sales, "sgst"), purchase_tax: sum(purchaseItems, "gst") },
      topProducts: Object.values(saleItems.reduce((acc, item) => {
        acc[item.product_id] ||= { product_name: item.product_name, qty: 0, amount: 0 };
        acc[item.product_id].qty += Number(item.qty || 0);
        acc[item.product_id].amount += Number(item.total || 0);
        return acc;
      }, {})).sort((a, b) => b.qty - a.qty).slice(0, 5),
      predictions: await predictionEngine.getLatestPredictions(this)
    };
  }

  async report(type, query = {}) {
    const from = query.from || "0000-01-01";
    const to = query.to || "9999-12-31";
    const map = {
      "sales-register": ["select * from sales where date between $1 and $2 order by date desc", [from, to]],
      "purchase-register": ["select * from purchases where purchase_date between $1 and $2 order by purchase_date desc", [from, to]],
      "gst-summary": ["select invoice_number, date, subtotal as taxable, cgst, sgst, grand_total from sales where date between $1 and $2 order by date desc", [from, to]],
      "cgst": ["select invoice_number, date, cgst from sales where date between $1 and $2 order by date desc", [from, to]],
      "sgst": ["select invoice_number, date, sgst from sales where date between $1 and $2 order by date desc", [from, to]],
      "hsn": ["select hsn_code, product_name, gst_percent, sum(qty) as qty, sum(total) as total from sale_items group by hsn_code, product_name, gst_percent", []],
      "date-wise-invoices": ["select * from sales where date between $1 and $2 order by date desc", [from, to]],
      "taxable": ["select product_name, gst_percent, (total - cgst - sgst) as taxable, total from sale_items", []]
    };
    const [sql, values] = map[type] || map["sales-register"];
    return { type, rows: await this.many(sql, values) };
  }

  async nextInvoiceNumber(client, date = today()) {
    const fy = getFinancialYear(date);
    const result = await client.query(`
      insert into invoice_sequences (financial_year, last_number, updated_at)
      values ($1, 1, now())
      on conflict (financial_year)
      do update set last_number = invoice_sequences.last_number + 1, updated_at = now()
      returning last_number
    `, [fy]);
    return formatInvoiceNumber(result.rows[0].last_number, fy, "SAG");
  }

  async one(sql, values = []) {
    const result = await this.pool.query(sql, values);
    return result.rows[0];
  }

  async getCreditSettings() {
    let settings = await this.one("select * from credit_settings where id = 'default'");
    if (!settings) {
      settings = await this.one(`
        insert into credit_settings (id, interest_enabled, monthly_interest_rate, calculation_type, grace_period_days, payment_allocation_policy, alert_periods, admin_notification_email, admin_notification_whatsapp)
        values ('default', true, 2.0, 'simple', 0, 'principal_first', '90,60,30,15,7,0', 'harshavardhanjunji@gmail.com', '+918660548244')
        returning *
      `);
    }
    return settings;
  }

  async updateCreditSettings(data) {
    const keys = Object.keys(data).filter(k => k !== 'id' && k !== 'updated_at');
    const sets = keys.map((key, index) => `${key} = $${index + 1}`);
    const result = await this.pool.query(
      `update credit_settings set ${sets.join(",")}, updated_at = now() where id = 'default' returning *`,
      keys.map(k => data[k])
    );
    return result.rows[0];
  }

  async listBatches(query = {}) {
    const term = `%${query.search || ""}%`;
    const where = query.search
      ? "where product_name ilike $1 or batch_number ilike $1 or supplier_name ilike $1"
      : "";
    const values = query.search ? [term] : [];
    const rows = await this.many(`select * from product_batches ${where} order by expiry_date asc nulls last`, values);

    const todayMs = new Date().setHours(0, 0, 0, 0);
    const list = rows.map(b => {
      let daysRemaining = null;
      let expiryStatus = "ACTIVE";
      if (b.expiry_date) {
        const expMs = new Date(b.expiry_date).getTime();
        daysRemaining = Math.ceil((expMs - todayMs) / 86400000);
        if (daysRemaining <= 0) expiryStatus = "EXPIRED";
        else if (daysRemaining <= 30) expiryStatus = "CRITICAL";
        else if (daysRemaining <= 60) expiryStatus = "WARNING";
        else if (daysRemaining <= 90) expiryStatus = "DUE_SOON";
        else expiryStatus = "GOOD";
      }
      return { ...b, days_remaining: daysRemaining, expiry_status: expiryStatus };
    });

    if (query.status && query.status !== "ALL") {
      return list.filter(b => b.expiry_status === query.status || b.status === query.status);
    }
    return list;
  }

  async createBatch(data, user) {
    const batch = await this.create("product_batches", {
      product_id: data.product_id || null,
      product_name: data.product_name,
      batch_number: data.batch_number,
      purchase_date: data.purchase_date || today(),
      mfg_date: data.mfg_date || null,
      expiry_date: data.expiry_date,
      initial_stock: Number(data.initial_stock || data.current_stock || 0),
      current_stock: Number(data.initial_stock || data.current_stock || 0),
      unit: data.unit || "Bag",
      purchase_price: Number(data.purchase_price || 0),
      selling_price: Number(data.selling_price || 0),
      supplier_name: data.supplier_name || "Direct Supplier",
      status: "ACTIVE"
    });

    if (batch.product_id) {
      await this.adjustStock(batch.product_id, {
        qty: batch.initial_stock,
        type: "batch_addition",
        note: `Batch ${batch.batch_number} added`
      }, user);
    }
    return batch;
  }

  async updateBatch(id, data) {
    return this.update("product_batches", id, data);
  }

  async deleteBatch(id) {
    return this.remove("product_batches", id);
  }

  async listCustomerInterestHistory(customerId) {
    if (customerId) {
      return this.many("select * from interest_history where customer_id = $1 order by created_at desc", [customerId]);
    }
    return this.many("select * from interest_history order by created_at desc");
  }

  async recordInterestEntry(record) {
    const entry = await this.create("interest_history", record);
    if (record.customer_id) {
      await this.pool.query(
        "update customers set pending_balance = $1, credit_amount = $1, updated_at = now() where id = $2",
        [record.total_balance_after, record.customer_id]
      );
    }
    return entry;
  }

  async listExpiryAlertHistory() {
    return this.many("select * from expiry_alert_history order by sent_at desc");
  }

  async recordExpiryAlert(record) {
    return this.create("expiry_alert_history", record);
  }

  async many(sql, values = []) {
    const result = await this.pool.query(sql, values);
    return result.rows;
  }
}

const tables = new Set([
  "products",
  "customers",
  "suppliers",
  "payments",
  "stock_logs",
  "sales",
  "purchases",
  "purchase_items",
  "sale_items",
  "digital_deliveries",
  "invoice_audit_logs",
  "invoice_sequences",
  "farmer_credit_ledger",
  "credit_payments",
  "interest_history",
  "credit_settings",
  "product_batches",
  "expiry_alert_history"
]);
const searchColumns = {
  products: ["name", "brand", "category", "product_type", "batch_number", "supplier_name"],
  customers: ["name", "mobile", "village"],
  suppliers: ["name", "contact_person", "mobile", "gstin"],
  payments: ["note", "payment_method"],
  stock_logs: ["product_name", "type", "note"],
  sales: ["invoice_number", "customer_name", "mobile"],
  purchases: ["invoice_number", "supplier_name"],
  product_batches: ["product_name", "batch_number", "supplier_name"],
  farmer_credit_ledger: ["farmer_name", "mobile", "village", "invoice_id"]
};

function assertTable(table) {
  if (!tables.has(table)) throw Object.assign(new Error("Invalid table"), { status: 400 });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function sum(rows, key) {
  return round(rows.reduce((total, row) => total + Number(row[key] || 0), 0));
}

function readableDatabaseError(error) {
  if (error?.code === "ENOTFOUND") {
    return `Database host not found: ${error.hostname}. Check the DATABASE_URL value in Vercel.`;
  }
  if (error?.code === "ECONNREFUSED" || error?.code === "ETIMEDOUT") {
    return "Database connection failed. Check that the DATABASE_URL host, port, password, and SSL mode are correct.";
  }
  if (error?.code === "28P01") {
    return "Database login failed. Check the username and password in DATABASE_URL.";
  }
  if (error?.code === "3D000") {
    return "Database name not found. Check the database name in DATABASE_URL.";
  }
  return error?.message || "Database connection failed.";
}
