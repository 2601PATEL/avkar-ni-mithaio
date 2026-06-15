# Avakar Ni Mithaio — Web Project

Ecommerce website for an Indian sweet shop, built as a clean multi-file frontend project.

---

## Project Structure

```
avakar-ni-mithaio/
│
├── index.html          # Markup only — all structure, no inline styles or scripts
│
├── css/
│   ├── base.css        # Design tokens, reset, shared utilities, footer
│   ├── nav.css         # Top navigation bar
│   ├── store.css       # Hero section and product grid
│   ├── cart.css        # Slide-out cart drawer
│   ├── admin.css       # Admin dashboard (stats, tabs, order cards, reminders)
│   └── modal.css       # Checkout modal and form
│
├── js/
│   ├── db.js           # SQLite (sql.js) init, schema, seed data, saveDB(), query()
│   ├── store.js        # Render product grid from DB
│   ├── cart.js         # Cart state, add/remove/qty, drawer open/close
│   ├── checkout.js     # Checkout modal, form validation, place order
│   ├── admin.js        # Dashboard stats, order lists, status updates, reminders
│   └── app.js          # Boot sequence, page routing, toast utility
│
└── assets/             # (reserved for images, icons, etc.)
```

---

## How to Run

Just open `index.html` in any modern browser — no build step, no server needed.

> The database runs entirely in the browser via [sql.js](https://sql.js.org/) and persists across page reloads using `localStorage`.

---

## Features

### Customer (Shop tab)
- Browse 10 classic Gujarat mithai with descriptions and prices
- Add to cart, adjust quantities, remove items
- Checkout form: name, phone, address, delivery date, special notes
- Order confirmation with sequential order number

### Store Owner (Admin tab)
- Live stats: pending, accepted, total orders, active reminders
- Tabs: Pending → Accept, Accepted → Complete, Completed log
- One-click Accept / Complete / Cancel per order
- Urgent badge on orders due within 2 days

### Supply Reminder System
- Scans all active orders due within **3 days**
- Lists exact ingredients needed per item (milk, ghee, besan, etc.)
- 🔴 Urgent flag for orders due tomorrow or today
- 🟡 Prepare flag for orders 2–3 days out

---

## Upgrading to a Real Backend

Currently uses browser-side SQLite. For production with 1,000+ daily visitors, work in progress to replace `js/db.js` with API calls to:

| Option | Type 
|---|---|
| [Supabase](https://supabase.com) | Postgres |
| [PlanetScale](https://planetscale.com) | MySQL |
| [Firebase](https://firebase.google.com) | NoSQL |

The rest of the JS files call `query()` and `saveDB()` — swap those two functions and everything else stays the same.
