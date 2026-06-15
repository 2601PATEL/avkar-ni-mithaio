/**
 * app.js
 * Application entry point.
 *   - Boots the DB and renders the initial UI
 *   - Page routing between Shop and Admin
 *   - Global toast utility
 */

// ── Boot ───────────────────────────────────────────────────────────────────────

(async () => {
  await initDB();      // db.js  — load / create SQLite DB
  renderProducts();    // store.js
  renderCart();        // cart.js
})();

// ── Page routing ───────────────────────────────────────────────────────────────

function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`nav-${page}`).classList.add('active');

  if (page === 'admin') loadAdmin();  // admin.js — refresh dashboard data
}

// ── Toast ──────────────────────────────────────────────────────────────────────

/**
 * Show a brief notification at the bottom-right of the screen.
 * @param {string}  msg      Message text
 * @param {boolean} isError  If true, renders in red accent
 */
function showToast(msg, isError = false) {
  const el = document.getElementById('toast');
  el.textContent           = msg;
  el.style.borderLeftColor = isError ? '#EF4444' : 'var(--marigold)';
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
}
