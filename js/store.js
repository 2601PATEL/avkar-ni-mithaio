/**
 * store.js
 * Fetches products from the DB and renders the product grid on the Shop page.
 */

function renderProducts() {
  const products = query('SELECT * FROM products ORDER BY id');
  const grid     = document.getElementById('product-grid');

  grid.innerHTML = products.map(p => `
    <div class="product-card">
      <div class="product-img">${p.emoji}</div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.desc}</div>
        <div class="product-meta">
          <div>
            <div class="product-price">₹${p.price}</div>
            <div class="product-unit">${p.unit}</div>
          </div>
          <button class="add-btn" onclick="addToCart(${p.id})">+ Add</button>
        </div>
      </div>
    </div>
  `).join('');
}
