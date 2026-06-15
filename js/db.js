/**
 * db.js
 * Initialises sql.js (in-browser SQLite), seeds product data on first run,
 * and persists the database to localStorage between page refreshes.
 *
 * Exports (globals):
 *   db        – the sql.js Database instance
 *   query()   – convenience SELECT helper
 *   saveDB()  – persist current DB state to localStorage
 */

const DB_KEY = 'avakar_db_v2';
let db;

/**
 * Run a SELECT and return an array of plain objects.
 * @param {string} sql
 * @param {Array}  params
 * @returns {Object[]}
 */
function query(sql, params = []) {
  const res = db.exec(sql, params);
  if (!res.length) return [];
  const { columns, values } = res[0];
  return values.map(row =>
    Object.fromEntries(columns.map((col, i) => [col, row[i]]))
  );
}

/** Serialise and write the current DB to localStorage. */
function saveDB() {
  const data = db.export();
  const b64  = btoa(String.fromCharCode(...data));
  localStorage.setItem(DB_KEY, b64);
}

/** Create tables and insert seed products. */
function createSchema() {
  db.run(`
    CREATE TABLE products (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      name  TEXT,
      emoji TEXT,
      desc  TEXT,
      price REAL,
      unit  TEXT
    );
    CREATE TABLE orders (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT,
      phone         TEXT,
      address       TEXT,
      delivery_date TEXT,
      notes         TEXT,
      status        TEXT    DEFAULT 'pending',
      created_at    TEXT    DEFAULT (datetime('now','localtime')),
      total         REAL    DEFAULT 0
    );
    CREATE TABLE order_items (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id     INTEGER,
      product_id   INTEGER,
      product_name TEXT,
      qty          INTEGER,
      price        REAL,
      FOREIGN KEY(order_id) REFERENCES orders(id)
    );
  `);

  const products = [
    ['Mohanthal',       '🟡', 'Rich gram flour fudge with saffron & cardamom',          320, 'per 500g'],
    ['Ghevar',          '🍯', 'Crispy disc soaked in sugar syrup, garnished with rabdi', 280, 'per piece'],
    ['Motichoor Ladoo', '🔮', 'Delicate boondi balls with pistachios & rose water',      240, 'per 500g'],
    ['Kaju Barfi',      '💎', 'Pure cashew & sugar diamond slices, silver-leafed',       480, 'per 500g'],
    ['Gajar Halwa',     '🥕', 'Slow-cooked carrot halwa with desi ghee & dry fruits',   220, 'per 500g'],
    ['Jalebi',          '🟠', 'Crispy fermented spirals soaked in warm sugar syrup',     160, 'per 500g'],
    ['Adadiya Pak',     '🌾', 'Winter special — urad dal, gum & ghee energy bites',     360, 'per 500g'],
    ['Shrikhand',       '🍶', 'Hung curd sweetened with saffron & cardamom',            180, 'per 400g'],
    ['Penda',           '🟤', 'Soft khoya rounds with saffron threads & cardamom',      260, 'per 500g'],
    ['Besan Chakki',    '🟫', 'Melt-in-mouth gram flour squares with nutmeg',           200, 'per 500g'],
  ];

  products.forEach(([name, emoji, desc, price, unit]) => {
    db.run(
      `INSERT INTO products (name, emoji, desc, price, unit) VALUES (?,?,?,?,?)`,
      [name, emoji, desc, price, unit]
    );
  });

  saveDB();
}

/**
 * Initialise the database.
 * Restores from localStorage if available, otherwise creates fresh schema.
 */
async function initDB() {
  const SQL = await initSqlJs({
    locateFile: f => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/${f}`
  });

  const saved = localStorage.getItem(DB_KEY);
  if (saved) {
    const buf = Uint8Array.from(atob(saved), c => c.charCodeAt(0));
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
    createSchema();
  }
}
