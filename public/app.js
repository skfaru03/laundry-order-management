/* ============================================================
   CleanPress — Frontend Application
   ============================================================ */

const API = '/api';

const PRICE_LIST = {
  shirt: 50, pants: 60, saree: 120, suit: 200, jacket: 150,
  dress: 100, kurta: 70, jeans: 80, tshirt: 40, blouse: 60,
  lehenga: 250, blanket: 180, bedsheet: 130, curtain: 150,
};

const STATUS_FLOW = ['RECEIVED', 'PROCESSING', 'READY', 'DELIVERED'];

const STATUS_COLOR = {
  RECEIVED: '#3b82f6',
  PROCESSING: '#f59e0b',
  READY: '#a855f7',
  DELIVERED: '#22c55e',
};

const STATUS_EMOJI = {
  RECEIVED: '📥', PROCESSING: '⚙️', READY: '✅', DELIVERED: '🚚',
};

// ============================================================
// NAVIGATION
// ============================================================
let currentPage = 'dashboard';

function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pageEl = document.getElementById(`page-${page}`);
  const navEl  = document.getElementById(`nav-${page}`);
  if (pageEl) pageEl.classList.add('active');
  if (navEl)  navEl.classList.add('active');

  const titles = { dashboard: 'Dashboard', orders: 'All Orders', create: 'New Order', prices: 'Price List' };
  document.getElementById('pageTitle').textContent = titles[page] || page;

  currentPage = page;

  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
  }

  if (page === 'dashboard') loadDashboard();
  if (page === 'orders')    loadOrders();
  if (page === 'prices')    renderPriceList();
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    navigateTo(item.dataset.page);
  });
});

document.getElementById('menuToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ============================================================
// CLOCK
// ============================================================
function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent =
    now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

// ============================================================
// TOAST
// ============================================================
function showToast(message, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ============================================================
// API HELPERS
// ============================================================
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'API error');
  return json;
}

// ============================================================
// DASHBOARD
// ============================================================
async function loadDashboard() {
  try {
    const { data } = await apiFetch('/dashboard');
    const { totalOrders, totalRevenue, ordersPerStatus, recentOrders } = data;

    document.getElementById('stat-total-val').textContent     = totalOrders;
    document.getElementById('stat-revenue-val').textContent   = `₹${totalRevenue.toLocaleString('en-IN')}`;
    document.getElementById('stat-pending-val').textContent   =
      (ordersPerStatus.RECEIVED || 0) + (ordersPerStatus.PROCESSING || 0) + (ordersPerStatus.READY || 0);
    document.getElementById('stat-delivered-val').textContent = ordersPerStatus.DELIVERED || 0;

    renderStatusBars(ordersPerStatus, totalOrders);
    renderRecentOrders(recentOrders);
  } catch (e) {
    showToast('Failed to load dashboard', 'error');
  }
}

function renderStatusBars(perStatus, total) {
  const container = document.getElementById('statusBars');
  container.innerHTML = '';
  STATUS_FLOW.forEach(s => {
    const count = perStatus[s] || 0;
    const pct   = total ? Math.round((count / total) * 100) : 0;
    container.innerHTML += `
      <div class="status-bar-item">
        <div class="status-bar-header">
          <span>${STATUS_EMOJI[s]} ${s}</span>
          <span><strong>${count}</strong> &nbsp;(${pct}%)</span>
        </div>
        <div class="status-bar-track">
          <div class="status-bar-fill" style="width:${pct}%; background:${STATUS_COLOR[s]};"></div>
        </div>
      </div>`;
  });
}

function renderRecentOrders(orders) {
  const container = document.getElementById('recentOrdersList');
  if (!orders.length) {
    container.innerHTML = `<div class="empty-state" style="padding:24px;">
      <div class="empty-state-icon">📭</div>
      <p>No orders yet</p></div>`;
    return;
  }
  container.innerHTML = orders.map(o => `
    <div class="recent-item" onclick="openOrderModal('${o.id}')">
      <div>
        <div class="recent-customer">${escHtml(o.customerName)}</div>
        <div class="recent-meta">${o.garments.length} item(s) · ${formatDate(o.createdAt)}</div>
      </div>
      <div class="recent-right">
        <div class="recent-amount">₹${o.totalAmount.toLocaleString('en-IN')}</div>
        <div style="margin-top:4px;">${badge(o.status)}</div>
      </div>
    </div>`).join('');
}

// ============================================================
// ORDERS LIST
// ============================================================
let searchDebounce;
let activeStatus = '';

document.getElementById('searchInput').addEventListener('input', e => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => loadOrders(), 350);
});

document.getElementById('filterChips').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  activeStatus = chip.dataset.status;
  loadOrders();
});

async function loadOrders() {
  const search = document.getElementById('searchInput').value.trim();
  const params = new URLSearchParams();
  if (activeStatus) params.set('status', activeStatus);
  if (search)       params.set('search', search);

  const container = document.getElementById('ordersTable');
  container.innerHTML = '<div class="empty-state">Loading…</div>';

  try {
    const { data: orders } = await apiFetch(`/orders?${params}`);
    if (!orders.length) {
      container.innerHTML = `<div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-title">No orders found</div>
        <div class="empty-state-sub">Try adjusting your filters or create a new order</div>
      </div>`;
      return;
    }
    container.innerHTML = `
      <table class="orders-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Garments</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Est. Delivery</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(o => orderRow(o)).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    container.innerHTML = `<div class="empty-state">Failed to load orders.</div>`;
    showToast('Failed to load orders', 'error');
  }
}

function orderRow(o) {
  const garmentSummary = o.garments.map(g =>
    `${g.type} ×${g.quantity}`).join(', ');
  return `
    <tr onclick="openOrderModal('${o.id}')">
      <td><span class="order-id-cell">#${o.id.slice(0, 8).toUpperCase()}</span></td>
      <td>
        <div class="customer-name">${escHtml(o.customerName)}</div>
        <div class="customer-phone">${escHtml(o.phone)}</div>
      </td>
      <td style="font-size:13px;color:var(--text-secondary);">${escHtml(garmentSummary)}</td>
      <td class="amount-cell">₹${o.totalAmount.toLocaleString('en-IN')}</td>
      <td>${badge(o.status)}</td>
      <td style="font-size:13px;color:var(--text-secondary);">${o.estimatedDelivery || '—'}</td>
      <td onclick="event.stopPropagation()">
        <div class="action-btns">
          <button class="btn-status" onclick="quickStatusUpdate('${o.id}', '${o.status}')" title="Update status">↑ Status</button>
          <button class="btn-delete" onclick="deleteOrder('${o.id}')" title="Delete order">🗑</button>
        </div>
      </td>
    </tr>`;
}

// ============================================================
// QUICK STATUS UPDATE (advances to next status in flow)
// ============================================================
async function quickStatusUpdate(id, currentStatus) {
  const idx  = STATUS_FLOW.indexOf(currentStatus);
  if (idx === STATUS_FLOW.length - 1) {
    showToast('Order already delivered', 'info'); return;
  }
  const next = STATUS_FLOW[idx + 1];
  try {
    await apiFetch(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: next }),
    });
    showToast(`Status updated → ${next}`, 'success');
    if (currentPage === 'orders') loadOrders();
    if (currentPage === 'dashboard') loadDashboard();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// ============================================================
// DELETE ORDER
// ============================================================
async function deleteOrder(id) {
  if (!confirm('Delete this order? This cannot be undone.')) return;
  try {
    await apiFetch(`/orders/${id}`, { method: 'DELETE' });
    showToast('Order deleted', 'success');
    loadOrders();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// ============================================================
// ORDER DETAIL MODAL
// ============================================================
async function openOrderModal(id) {
  try {
    const { data: o } = await apiFetch(`/orders/${id}`);
    const content = `
      <div class="modal-title">🧺 Order Detail</div>
      <div class="modal-detail-row"><span class="modal-detail-label">Order ID</span><span style="font-family:monospace;font-size:13px;">#${o.id.toUpperCase()}</span></div>
      <div class="modal-detail-row"><span class="modal-detail-label">Customer</span><span>${escHtml(o.customerName)}</span></div>
      <div class="modal-detail-row"><span class="modal-detail-label">Phone</span><span>${escHtml(o.phone)}</span></div>
      <div class="modal-detail-row"><span class="modal-detail-label">Status</span><span>${badge(o.status)}</span></div>
      <div class="modal-detail-row"><span class="modal-detail-label">Created</span><span>${formatDate(o.createdAt)}</span></div>
      <div class="modal-detail-row"><span class="modal-detail-label">Est. Delivery</span><span>${o.estimatedDelivery || '—'}</span></div>
      <div class="modal-garments">
        <div style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:10px;text-transform:uppercase;letter-spacing:.06em;">Garments</div>
        ${o.garments.map(g => `
          <div class="modal-garment-item">
            <span>${escHtml(g.type)} × ${g.quantity}</span>
            <span style="color:var(--accent-hover);">₹${(g.quantity * g.pricePerItem).toLocaleString('en-IN')}</span>
          </div>`).join('')}
      </div>
      <div class="modal-detail-row" style="margin-top:12px;font-size:16px;font-weight:700;">
        <span>Total</span>
        <span style="color:var(--accent-hover);">₹${o.totalAmount.toLocaleString('en-IN')}</span>
      </div>
      <div class="status-select-wrapper">
        <label>Update Status</label>
        <select id="modalStatusSelect">
          ${STATUS_FLOW.map(s => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${STATUS_EMOJI[s]} ${s}</option>`).join('')}
        </select>
        <button class="btn btn-primary" style="width:100%;" onclick="updateStatusFromModal('${o.id}')">
          Save Status
        </button>
      </div>`;

    document.getElementById('modalContent').innerHTML = content;
    document.getElementById('modalOverlay').classList.add('open');
  } catch (e) {
    showToast('Could not load order', 'error');
  }
}

async function updateStatusFromModal(id) {
  const status = document.getElementById('modalStatusSelect').value;
  try {
    await apiFetch(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    showToast(`Status updated → ${status}`, 'success');
    closeModal();
    if (currentPage === 'orders') loadOrders();
    if (currentPage === 'dashboard') loadDashboard();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

// ============================================================
// CREATE ORDER FORM
// ============================================================
let garmentCount = 0;

function addGarmentRow() {
  garmentCount++;
  const id   = garmentCount;
  const list = document.getElementById('garmentsList');

  const options = Object.keys(PRICE_LIST)
    .map(g => `<option value="${g}">${capitalize(g)} — ₹${PRICE_LIST[g]}</option>`)
    .join('');

  const row = document.createElement('div');
  row.className = 'garment-row';
  row.id = `garment-${id}`;
  row.innerHTML = `
    <div class="form-group">
      <label>Garment Type</label>
      <select id="gtype-${id}" onchange="recalculate()">
        ${options}
      </select>
    </div>
    <div class="form-group">
      <label>Quantity</label>
      <input type="number" id="gqty-${id}" min="1" value="1" placeholder="1" oninput="recalculate()" />
    </div>
    <div class="form-group">
      <label>Price/Item (₹)</label>
      <input type="number" id="gprice-${id}" min="0" placeholder="Auto" oninput="recalculate()" />
    </div>
    <button class="garment-remove" onclick="removeGarment(${id})" title="Remove">✕</button>`;

  list.appendChild(row);
  // Auto-fill price
  const select = document.getElementById(`gtype-${id}`);
  autoFillPrice(id);
  select.addEventListener('change', () => autoFillPrice(id));

  recalculate();
}

function autoFillPrice(id) {
  const type  = document.getElementById(`gtype-${id}`)?.value;
  const priceInput = document.getElementById(`gprice-${id}`);
  if (priceInput && !priceInput.dataset.manual) {
    priceInput.value = PRICE_LIST[type] || '';
    priceInput.placeholder = `₹${PRICE_LIST[type] || '—'}`;
  }
}

function removeGarment(id) {
  document.getElementById(`garment-${id}`)?.remove();
  recalculate();
}

function recalculate() {
  const rows   = document.querySelectorAll('.garment-row');
  const items  = [];
  let total    = 0;

  rows.forEach(row => {
    const id   = row.id.replace('garment-', '');
    const type = document.getElementById(`gtype-${id}`)?.value;
    const qty  = parseInt(document.getElementById(`gqty-${id}`)?.value) || 0;
    const price= parseFloat(document.getElementById(`gprice-${id}`)?.value) || PRICE_LIST[type] || 0;
    if (type && qty > 0) {
      items.push({ type, qty, price, subtotal: qty * price });
      total += qty * price;
    }
  });

  const summary = document.getElementById('orderSummary');
  if (items.length === 0) { summary.style.display = 'none'; return; }
  summary.style.display = 'block';

  document.getElementById('summaryItems').innerHTML =
    items.map(i => `<div class="summary-item"><span>${capitalize(i.type)} × ${i.qty}</span><span>₹${i.subtotal}</span></div>`).join('');
  document.getElementById('summaryTotal').textContent = `₹${total.toLocaleString('en-IN')}`;
}

function resetForm() {
  document.getElementById('customerName').value = '';
  document.getElementById('phone').value = '';
  document.getElementById('garmentsList').innerHTML = '';
  document.getElementById('orderSummary').style.display = 'none';
  garmentCount = 0;
  clearFormErrors();
}

function clearFormErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  document.querySelectorAll('.form-group.has-error').forEach(el => el.classList.remove('has-error'));
}

document.getElementById('createOrderForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFormErrors();

  const customerName = document.getElementById('customerName').value.trim();
  const phone        = document.getElementById('phone').value.trim();

  let valid = true;
  if (!customerName) {
    setFieldError('customerName', 'Customer name is required');
    valid = false;
  }
  if (!phone) {
    setFieldError('phone', 'Phone number is required');
    valid = false;
  }

  const rows = document.querySelectorAll('.garment-row');
  if (rows.length === 0) {
    showToast('Add at least one garment', 'error');
    valid = false;
  }

  if (!valid) return;

  const garments = [];
  rows.forEach(row => {
    const id    = row.id.replace('garment-', '');
    const type  = document.getElementById(`gtype-${id}`)?.value;
    const qty   = parseInt(document.getElementById(`gqty-${id}`)?.value) || 1;
    const price = parseFloat(document.getElementById(`gprice-${id}`)?.value) || PRICE_LIST[type] || 0;
    garments.push({ type, quantity: qty, pricePerItem: price });
  });

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.textContent = 'Creating…';

  try {
    const { data: order } = await apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify({ customerName, phone, garments }),
    });

    showSuccessOverlay(order);
    resetForm();
  } catch (e) {
    showToast(e.message || 'Failed to create order', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Order';
  }
});

function setFieldError(fieldId, msg) {
  const input = document.getElementById(fieldId);
  const err   = document.getElementById(`err-${fieldId}`);
  if (input) input.closest('.form-group')?.classList.add('has-error');
  if (err)   err.textContent = msg;
}

// ============================================================
// SUCCESS OVERLAY
// ============================================================
function showSuccessOverlay(order) {
  const details = document.getElementById('successDetails');
  details.innerHTML = `
    <div class="success-detail-row"><span>Order ID</span><span>#${order.id.slice(0,8).toUpperCase()}</span></div>
    <div class="success-detail-row"><span>Customer</span><span>${escHtml(order.customerName)}</span></div>
    <div class="success-detail-row"><span>Garments</span><span>${order.garments.length} item(s)</span></div>
    <div class="success-detail-row"><span>Total Bill</span><span>₹${order.totalAmount.toLocaleString('en-IN')}</span></div>
    <div class="success-detail-row"><span>Est. Delivery</span><span>${order.estimatedDelivery}</span></div>
  `;
  document.getElementById('successOverlay').style.display = 'flex';
}

function closeSuccess() {
  document.getElementById('successOverlay').style.display = 'none';
}

// ============================================================
// PRICE LIST PAGE
// ============================================================
function renderPriceList() {
  const grid = document.getElementById('priceGrid');
  grid.innerHTML = Object.entries(PRICE_LIST)
    .map(([g, p]) => `
      <div class="price-item">
        <span class="price-garment">👕 ${capitalize(g)}</span>
        <span class="price-amount">₹${p}</span>
      </div>`)
    .join('');
}

// ============================================================
// HELPERS
// ============================================================
function badge(status) {
  return `<span class="badge badge-${status}">${STATUS_EMOJI[status]} ${status}</span>`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ============================================================
// INIT
// ============================================================
(function init() {
  navigateTo('dashboard');
  addGarmentRow(); // Start with one garment row on the create form
})();
