/**
 * checkout.js
 * Handles the checkout modal: building the order summary, form validation,
 * writing the order + order_items rows to the DB, and showing confirmation.
 */

// ── Open / Close ───────────────────────────────────────────────────────────────

function openCheckout() {
  if (cartCount() === 0) return;

  // Minimum selectable date = today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('cust-date').min = today;

  // Build inline order summary
  const itemRows = Object.values(cart).map(({ product, qty }) => `
    <div class="order-summary-row">
      <span>${product.emoji} ${product.name} ×${qty}</span>
      <span>₹${(product.price * qty).toFixed(2)}</span>
    </div>
  `).join('');

  document.getElementById('checkout-items').innerHTML =
    itemRows +
    `<div class="order-summary-row order-summary-total">
       <span>Total</span><span>₹${cartTotal().toFixed(2)}</span>
     </div>`;

  // Reset to form view
  document.getElementById('checkout-body').style.display    = 'block';
  document.getElementById('checkout-success').style.display = 'none';

  document.getElementById('checkout-modal').classList.add('open');
  closeCart();
}

function closeCheckout() {
  document.getElementById('checkout-modal').classList.remove('open');
}

// ── Place Order ────────────────────────────────────────────────────────────────

function placeOrder() {
  const name  = document.getElementById('cust-name').value.trim();
  const phone = document.getElementById('cust-phone').value.trim();
  const addr  = document.getElementById('cust-addr').value.trim();
  const date  = document.getElementById('cust-date').value;
  const note  = document.getElementById('cust-note').value.trim();

  if (!name || !phone || !date) {
    showToast('Please fill in your name, phone number and delivery date.', true);
    return;
  }

  const total = cartTotal();

  // Insert order header
  db.run(
    `INSERT INTO orders (customer_name, phone, address, delivery_date, notes, status, total)
     VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
    [name, phone, addr, date, note, total]
  );

  const orderId = db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0];

  // Insert line items
  Object.values(cart).forEach(({ product, qty }) => {
    db.run(
      `INSERT INTO order_items (order_id, product_id, product_name, qty, price)
       VALUES (?, ?, ?, ?, ?)`,
      [orderId, product.id, product.name, qty, product.price]
    );
  });

  saveDB();

  // Show confirmation
  document.getElementById('checkout-body').style.display    = 'none';
  document.getElementById('checkout-success').style.display = 'block';
  document.getElementById('order-num-display').textContent  =
    `#${String(orderId).padStart(4, '0')}`;
}
