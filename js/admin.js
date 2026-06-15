/**
 * admin.js
 * Powers the store owner dashboard:
 *   - Stats (pending / accepted / total / reminders)
 *   - Order lists per status tab with Accept / Complete / Cancel actions
 *   - Supply reminder engine: flags orders due within 3 days
 */

// ── Supply map ─────────────────────────────────────────────────────────────────
// Maps each product name to the raw ingredients the owner needs to have ready.
const SUPPLY_MAP = {
  'Mohanthal':       ['Besan', 'Ghee', 'Sugar', 'Saffron', 'Cardamom'],
  'Ghevar':          ['Maida', 'Ghee', 'Sugar', 'Full Cream Milk'],
  'Motichoor Ladoo': ['Besan', 'Sugar', 'Ghee', 'Rose water', 'Pistachios'],
  'Kaju Barfi':      ['Cashews', 'Sugar', 'Silver leaf'],
  'Gajar Halwa':     ['Carrots', 'Full Cream Milk', 'Sugar', 'Ghee', 'Dry fruits'],
  'Jalebi':          ['Maida', 'Curd', 'Sugar', 'Saffron'],
  'Adadiya Pak':     ['Urad dal flour', 'Ghee', 'Gum crystals', 'Dry fruits'],
  'Shrikhand':       ['Full Cream Milk', 'Curd', 'Sugar', 'Saffron', 'Cardamom'],
  'Penda':           ['Full Cream Milk', 'Khoya', 'Sugar', 'Cardamom'],
  'Besan Chakki':    ['Besan', 'Ghee', 'Sugar', 'Nutmeg'],
};

// ── Main loader ────────────────────────────────────────────────────────────────

function loadAdmin() {
  updateStats();
  renderOrderList('pending',   'list-pending');
  renderOrderList('accepted',  'list-accepted');
  renderOrderList('completed', 'list-completed');
  loadReminders();
}

// ── Stats ──────────────────────────────────────────────────────────────────────

function updateStats() {
  const pending   = query(`SELECT COUNT(*) AS c FROM orders WHERE status='pending'`)[0].c;
  const accepted  = query(`SELECT COUNT(*) AS c FROM orders WHERE status='accepted'`)[0].c;
  const total     = query(`SELECT COUNT(*) AS c FROM orders`)[0].c;
  const remCount  = countUpcomingOrders();

  document.getElementById('stat-pending').textContent   = pending;
  document.getElementById('stat-accepted').textContent  = accepted;
  document.getElementById('stat-total').textContent     = total;
  document.getElementById('stat-reminders').textContent = remCount;
}

// ── Order lists ────────────────────────────────────────────────────────────────

function renderOrderList(status, listId) {
  const orders = query(
    `SELECT * FROM orders WHERE status=? ORDER BY delivery_date ASC`,
    [status]
  );
  const el = document.getElementById(listId);

  if (!orders.length) {
    el.innerHTML = `
      <div class="empty-state">
        <span class="icon">📋</span>No ${status} orders.
      </div>`;
    return;
  }

  el.innerHTML = orders.map(o => buildOrderCard(o, status)).join('');
}

function buildOrderCard(o, status) {
  const items    = query(`SELECT * FROM order_items WHERE order_id=?`, [o.id]);
  const itemStr  = items.map(i => `${i.product_name} ×${i.qty}`).join(', ');
  const daysLeft = daysUntil(o.delivery_date);
  const urgentTag = daysLeft <= 2 && status !== 'completed'
    ? `<span class="order-urgent"> ⚠ Due in ${daysLeft}d</span>`
    : '';

  return `
    <div class="order-card">
      <div>
        <div class="order-id">Order #${pad(o.id)} · ${(o.created_at || '').split(' ')[0]}</div>
        <div class="order-customer">${o.customer_name}${urgentTag}</div>
        <div class="order-phone">📞 ${o.phone}${o.address ? ` · 📍 ${o.address}` : ''}</div>
        <div class="order-items-list">🍬 ${itemStr}</div>
        ${o.notes ? `<div class="order-note">📝 ${o.notes}</div>` : ''}
        <div class="order-dates">📅 Delivery: <b>${o.delivery_date}</b></div>
        <div class="order-total">₹${parseFloat(o.total).toFixed(2)}</div>
      </div>
      <div class="order-actions">
        <span class="status-badge status-${o.status}">${o.status}</span>
        ${status === 'pending'
          ? `<button class="accept-btn"   onclick="updateStatus(${o.id}, 'accepted')">✓ Accept</button>`
          : ''}
        ${status === 'accepted'
          ? `<button class="complete-btn" onclick="updateStatus(${o.id}, 'completed')">✓ Complete</button>`
          : ''}
        ${status !== 'completed' && status !== 'cancelled'
          ? `<button class="cancel-btn"   onclick="updateStatus(${o.id}, 'cancelled')">Cancel</button>`
          : ''}
      </div>
    </div>
  `;
}

// ── Status updates ─────────────────────────────────────────────────────────────

function updateStatus(id, status) {
  db.run(`UPDATE orders SET status=? WHERE id=?`, [status, id]);
  saveDB();
  loadAdmin();
  showToast(`Order #${pad(id)} marked ${status}`);
}

// ── Reminder engine ────────────────────────────────────────────────────────────

/**
 * Returns orders whose delivery_date falls within the next 3 days
 * (i.e. the owner should have supplies ready 1 day before).
 */
function getUpcomingOrders() {
  const todayStr = todayISO();
  const plus3Str = offsetDateISO(3);

  return query(
    `SELECT * FROM orders
     WHERE status IN ('pending','accepted')
       AND delivery_date BETWEEN ? AND ?
     ORDER BY delivery_date ASC`,
    [todayStr, plus3Str]
  );
}

function countUpcomingOrders() {
  return getUpcomingOrders().length;
}

function loadReminders() {
  const upcoming = getUpcomingOrders();
  const el       = document.getElementById('list-reminders');

  if (!upcoming.length) {
    el.innerHTML = `
      <div class="empty-state">
        <span class="icon">✅</span>No orders due in the next 3 days. All clear!
      </div>`;
    return;
  }

  el.innerHTML = upcoming.map(o => buildReminderCard(o)).join('');
}

function buildReminderCard(o) {
  const items    = query(`SELECT * FROM order_items WHERE order_id=?`, [o.id]);
  const daysLeft = daysUntil(o.delivery_date);
  const isUrgent = daysLeft <= 1;

  const supplyLines = items.map(i => {
    const needs = SUPPLY_MAP[i.product_name] || ['General supplies'];
    return `<b>${i.product_name} ×${i.qty}</b>: ${needs.join(', ')}`;
  }).join('<br/>');

  const dueLabel = daysLeft <= 0 ? '⚠ Due Today' : `${daysLeft} day(s) away`;

  return `
    <div class="reminder-card ${isUrgent ? 'urgent' : ''}">
      <div class="reminder-title">
        ${isUrgent ? '🚨' : '⏰'} Order #${pad(o.id)} — ${o.customer_name}
      </div>
      <div class="reminder-detail">
        📅 Delivery: <b>${o.delivery_date}</b> &nbsp;|&nbsp; ${dueLabel}
      </div>
      <div class="reminder-detail" style="margin-top:8px;">
        <b>Prepare supplies now:</b><br/>${supplyLines}
      </div>
      <span class="reminder-badge ${isUrgent ? 'urgent' : ''}">
        ${isUrgent ? '🔴 ORDER SOON' : '🟡 PREPARE SUPPLIES'}
      </span>
    </div>
  `;
}

// ── Tab switching ──────────────────────────────────────────────────────────────

function switchTab(tab, btn) {
  document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(`tab-${tab}`).style.display = 'block';
  btn.classList.add('active');
}

// ── Date helpers ───────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function offsetDateISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function daysUntil(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / 86_400_000);
}

function pad(id) {
  return String(id).padStart(4, '0');
}
