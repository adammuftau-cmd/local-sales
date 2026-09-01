import * as db from './db.js';
import { renderDashboard } from './views/dashboard.js';
import { renderSales, openSaleModal } from './views/sales.js';
import { renderInventory, openProductModal } from './views/inventory.js';
import { renderExpenses, openExpenseModal } from './views/expenses.js';
import { renderDebts, openDebtModal } from './views/debts.js';
import { renderBudget, openBudgetModal } from './views/budget.js';
import { renderSettings } from './views/settings.js';

// ---------------------------------------------------------------------------
// Global state — loaded from IndexedDB, shared with every view module.
// ---------------------------------------------------------------------------
export const state = {
  products: [],
  sales: [],
  expenses: [],
  debts: [],
  budget: [],
  shopName: localStorage.getItem('ledger_shopname') || 'My Shop'
};

const views = ['dashboard', 'sales', 'inventory', 'expenses', 'debts', 'budget', 'settings'];
const viewTitles = {
  dashboard: 'Dashboard', sales: 'Sales', inventory: 'Inventory',
  expenses: 'Expenses', debts: 'Debt Tracker', budget: 'Budget Sheet', settings: 'Settings'
};
let currentView = 'dashboard';

// ---------------------------------------------------------------------------
// Shared UI helpers, exposed to view modules
// ---------------------------------------------------------------------------
export function toast(msg, isErr = false) {
  const wrap = document.getElementById('toast-wrap');
  const el = document.createElement('div');
  el.className = 'toast' + (isErr ? ' err' : '');
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

export function openModal(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-backdrop').classList.add('active');
}
export function closeModal() {
  document.getElementById('modal-backdrop').classList.remove('active');
  document.getElementById('modal-content').innerHTML = '';
}
document.getElementById('modal-backdrop').addEventListener('click', (e) => {
  if (e.target.id === 'modal-backdrop') closeModal();
});

// Wrap the raw db functions so every mutation refreshes state + re-renders,
// which is what the (unchanged) view modules expect from earlier "live sync" code.
async function addItem(storeName, data) {
  const record = await db.addItem(storeName, data);
  await reloadStore(storeName);
  renderAll();
  return record;
}
async function updateItem(storeName, id, data) {
  const record = await db.updateItem(storeName, id, data);
  await reloadStore(storeName);
  renderAll();
  return record;
}
async function deleteItem(storeName, id) {
  await db.deleteItem(storeName, id);
  await reloadStore(storeName);
  renderAll();
}

export const actions = {
  addItem, updateItem, deleteItem, toast, openModal, closeModal, getState: () => state,
  exportAll: db.exportAll, importAll: db.importAll, clearAll: db.clearAll, reloadAll
};

// ---------------------------------------------------------------------------
// Rendering / routing
// ---------------------------------------------------------------------------
const renderers = {
  dashboard: () => renderDashboard(document.getElementById('view-dashboard'), state, actions),
  sales: () => renderSales(document.getElementById('view-sales'), state, actions),
  inventory: () => renderInventory(document.getElementById('view-inventory'), state, actions),
  expenses: () => renderExpenses(document.getElementById('view-expenses'), state, actions),
  debts: () => renderDebts(document.getElementById('view-debts'), state, actions),
  budget: () => renderBudget(document.getElementById('view-budget'), state, actions),
  settings: () => renderSettings(document.getElementById('view-settings'), state, actions)
};

const fabHandlers = {
  sales: () => openSaleModal(state, actions),
  inventory: () => openProductModal(state, actions),
  expenses: () => openExpenseModal(state, actions),
  debts: () => openDebtModal(state, actions),
  budget: () => openBudgetModal(state, actions)
};

function renderAll() {
  views.forEach((v) => renderers[v]());
}

function switchView(view) {
  currentView = view;
  views.forEach((v) => document.getElementById(`view-${v}`).classList.toggle('active', v === view));
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  document.getElementById('view-title').textContent = viewTitles[view];
  const fab = document.getElementById('fab-add');
  if (fabHandlers[view]) { fab.classList.add('show'); fab.onclick = fabHandlers[view]; }
  else { fab.classList.remove('show'); }
  document.getElementById('sidebar').classList.remove('open');
}

document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});
document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------
async function reloadStore(storeName) {
  state[storeName] = await db.getAll(storeName);
}
async function reloadAll() {
  const [products, sales, expenses, debts, budget] = await Promise.all([
    db.getAll('products'), db.getAll('sales'), db.getAll('expenses'), db.getAll('debts'), db.getAll('budget')
  ]);
  state.products = products; state.sales = sales; state.expenses = expenses;
  state.debts = debts; state.budget = budget;
}

// ---------------------------------------------------------------------------
// Boot — no auth screen, straight into the app.
// ---------------------------------------------------------------------------
(async function init() {
  document.getElementById('shop-name-display').textContent = state.shopName;
  try {
    await reloadAll();
  } catch (err) {
    console.error('Failed to load local data:', err);
    toast('Could not load local data — try reloading the page.', true);
  }
  document.getElementById('app-shell').classList.add('active');
  switchView('dashboard');
  renderAll();
})();
