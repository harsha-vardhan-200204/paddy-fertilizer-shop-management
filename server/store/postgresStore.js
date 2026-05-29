import pg from "pg";
import { randomUUID } from "crypto";
import { round } from "../utils/reports.js";

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
    await this.pool.query("select 1");
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
      const invoiceNumber = await this.nextInvoiceNumber(client);
      const customer = data.customer_id ? await client.query("select * from customers where id = $1", [data.customer_id]) : { rows: [] };
      const c = customer.rows[0] || {};
      const sale = await client.query(
        `insert into sales (id, invoice_number, date, customer_id, customer_name, mobile, village, billing_address, gstin, subtotal, cgst, sgst, grand_total, amount_paid, balance_due, payment_method, created_by)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) returning *`,
        [randomUUID(), invoiceNumber, data.date || today(), data.customer_id || null, data.customer_name || c.name || "", data.mobile || c.mobile || "", data.village || c.village || "", data.billing_address || c.address || "", data.gstin || "", data.subtotal, data.cgst, data.sgst, data.grand_total, Number(data.amount_paid || 0), round(data.grand_total - Number(data.amount_paid || 0)), data.payment_method || "Cash", user?.name]
      );
      for (const item of data.items || []) {
        await client.query(
          `insert into sale_items (id, sale_id, product_id, product_name, hsn_code, qty, rate, discount, gst_percent, cgst, sgst, total)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [randomUUID(), sale.rows[0].id, item.product_id, item.product_name, item.hsn_code, item.qty, item.rate, item.discount, item.gst_percent, item.cgst, item.sgst, item.total]
        );
        const qty = Number(item.qty || 0);
        const stock = await client.query(
          "update products set current_stock = coalesce(current_stock, 0) - $1, updated_at = now() where id = $2 returning name",
          [qty, item.product_id]
        );
        if (!stock.rows[0]) throw Object.assign(new Error(`Product not found for stock update: ${item.product_name || item.product_id}`), { status: 404 });
        await client.query("insert into stock_logs (id, product_id, product_name, type, qty, note, created_by) values ($1,$2,$3,$4,$5,$6,$7)", [randomUUID(), item.product_id, item.product_name || stock.rows[0].name, "sale", -qty, invoiceNumber, user?.name]);
      }
      if (data.customer_id && sale.rows[0].balance_due > 0) {
        await client.query("update customers set pending_balance = coalesce(pending_balance,0) + $1, credit_amount = coalesce(credit_amount,0) + $1 where id = $2", [sale.rows[0].balance_due, data.customer_id]);
      }
      await client.query("commit");
      return this.getSale(sale.rows[0].id);
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
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
      }, {})).sort((a, b) => b.qty - a.qty).slice(0, 5)
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

  async nextInvoiceNumber(client) {
    const result = await client.query("select count(*)::int as count from sales");
    return `GST-${new Date().getFullYear()}-${String(result.rows[0].count + 1).padStart(5, "0")}`;
  }

  async one(sql, values = []) {
    const result = await this.pool.query(sql, values);
    return result.rows[0];
  }

  async many(sql, values = []) {
    const result = await this.pool.query(sql, values);
    return result.rows;
  }
}

const tables = new Set(["products", "customers", "suppliers", "payments", "stock_logs", "sales", "purchases", "purchase_items", "sale_items"]);
const searchColumns = {
  products: ["name", "brand", "category", "product_type", "batch_number", "supplier_name"],
  customers: ["name", "mobile", "village"],
  suppliers: ["name", "contact_person", "mobile", "gstin"],
  payments: ["note", "payment_method"],
  stock_logs: ["product_name", "type", "note"],
  sales: ["invoice_number", "customer_name", "mobile"],
  purchases: ["invoice_number", "supplier_name"]
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
