/**
 * cart.js
 * Manages the in-memory cart state and renders the slide-out cart drawer.
 *
 * Cart shape: { [product_id]: { product: Object, qty: Number } }
 */

let cart = {};

// ── Mutations ──────────────────────────────────────────────────────────────────

function addToCart(pid) {
  const product = query('SELECT * FROM products WHERE id=?', [pid])[0];
  if (cart[pid]) {
    cart[pid].qty++;
  } else {
    cart[pid] = { product, qty: 1 };
  }
  renderCart();
  showToast(`${product.emoji} ${product.name} added!`);
}

function changeQty(pid, delta) {
  if (!cart[pid]) return;
  cart[pid].qty += delta;
  if (cart[pid].qty <= 0) delete cart[pid];
  renderCart();
}

function removeFromCart(pid) {
  delete cart[pid];
  renderCart();
}

function clearCart() {
  cart = {};
  renderCart();
}

// ── Computed ───────────────────────────────────────────────────────────────────

function cartTotal() {
  return Object.values(cart).reduce(
    (sum, { product, qty }) => sum + product.price * qty, 0
  );
}

function cartCount() {
  return Object.values(cart).reduce((sum, { qty }) => sum + qty, 0);
}

// ── Render ─────────────────────────────────────────────────────────────────────

function renderCart() {
  const count  = cartCount();
  const badge  = document.getElementById('cart-count');
  const list   = document.getElementById('cart-items-list');
  const footer = document.getElementById('cart-footer');

  badge.textContent = count;

  if (count === 0) {
    list.innerHTML = `
      <div class="cart-empty">
        <span class="cart-empty-icon">🛒</span>
        Your cart is empty.<br/>Add some mithai!
      </div>`;
    footer.style.display = 'none';
    return;
  }

  list.innerHTML = Object.entries(cart).map(([pid, { product, qty }]) => `
    <div class="cart-item">
      <div class="cart-item-emoji">${product.emoji}</div>
      <div class="cart-item-details">
        <div class="cart-item-name">${product.name}</div>
        <div class="cart-item-price">₹${product.price} ${product.unit}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeQty(${pid}, -1)">−</button>
          <span class="qty-val">${qty}</span>
          <button class="qty-btn" onclick="changeQty(${pid}, 1)">+</button>
        </div>
      </div>
      <button class="remove-item" onclick="removeFromCart(${pid})" title="Remove">🗑</button>
    </div>
  `).join('');

  footer.style.display = 'block';
  document.getElementById('cart-total-amt').textContent = `₹${cartTotal().toFixed(2)}`;
}

// ── Drawer open / close ────────────────────────────────────────────────────────

function openCart() {
  document.getElementById('overlay').classList.add('open');
  document.getElementById('cart-drawer').classList.add('open');
}

function closeCart() {
  document.getElementById('overlay').classList.remove('open');
  document.getElementById('cart-drawer').classList.remove('open');
}
