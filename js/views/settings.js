export function renderSettings(container, state, actions) {
  container.innerHTML = `
    <div class="card" style="max-width:520px;margin-bottom:18px;">
      <strong style="font-family:var(--font-display);font-size:1rem;">Shop name</strong>
      <p style="color:var(--ink-soft);font-size:0.85rem;margin:4px 0 12px;">Shown at the top of the sidebar.</p>
      <div style="display:flex;gap:10px;">
        <input type="text" id="set-shopname" value="${escapeAttr(state.shopName)}" style="flex:1;padding:9px 12px;border:1.5px solid var(--line);border-radius:var(--radius-sm);">
        <button class="btn btn-primary btn-sm" id="set-shopname-save">Save</button>
      </div>
    </div>

    <div class="card" style="max-width:520px;margin-bottom:18px;">
      <strong style="font-family:var(--font-display);font-size:1rem;">Backup &amp; restore</strong>
      <p style="color:var(--ink-soft);font-size:0.85rem;margin:4px 0 14px;">
        Your data lives only on this device's browser storage — there's no cloud copy since there's no login.
        Export a backup file regularly, especially before switching phones, reinstalling the app, or clearing browser data.
      </p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn btn-gold btn-sm" id="set-export">⬇ Export backup (.json)</button>
        <label class="btn btn-ghost btn-sm" style="margin:0;">
          ⬆ Restore from file
          <input type="file" id="set-import" accept="application/json" style="display:none;">
        </label>
      </div>
      <div class="auth-error" id="set-io-msg" style="margin-top:10px;"></div>
    </div>

    <div class="card" style="max-width:520px;border-color:rgba(181,72,45,0.3);">
      <strong style="font-family:var(--font-display);font-size:1rem;color:var(--red);">Danger zone</strong>
      <p style="color:var(--ink-soft);font-size:0.85rem;margin:4px 0 12px;">Permanently deletes every product, sale, expense, debt and budget line on this device. This cannot be undone — export a backup first.</p>
      <button class="btn btn-danger btn-sm" id="set-clear">Erase all data</button>
    </div>
  `;

  document.getElementById('set-shopname-save').addEventListener('click', () => {
    const name = document.getElementById('set-shopname').value.trim() || 'My Shop';
    localStorage.setItem('ledger_shopname', name);
    state.shopName = name;
    document.getElementById('shop-name-display').textContent = name;
    actions.toast('Shop name saved');
  });

  document.getElementById('set-export').addEventListener('click', async () => {
    try {
      const data = await actions.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `ledger-backup-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      actions.toast('Backup downloaded');
    } catch (err) {
      actions.toast(err.message, true);
    }
  });

  document.getElementById('set-import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    const msgEl = document.getElementById('set-io-msg');
    if (!file) return;
    if (!confirm('Restoring a backup replaces ALL current data on this device with the contents of the file. Continue?')) {
      e.target.value = '';
      return;
    }
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await actions.importAll(data);
      actions.toast('Backup restored — reloading…');
      setTimeout(() => location.reload(), 700);
    } catch (err) {
      msgEl.textContent = 'Could not restore this file: ' + err.message;
    }
  });

  document.getElementById('set-clear').addEventListener('click', async () => {
    if (!confirm('This will permanently erase ALL data on this device. Type-confirm by clicking OK only if you have a backup or are sure.')) return;
    if (!confirm('Really erase everything? This is your last chance to cancel.')) return;
    try {
      await actions.clearAll();
      actions.toast('All data erased — reloading…');
      setTimeout(() => location.reload(), 700);
    } catch (err) {
      actions.toast(err.message, true);
    }
  });
}

function escapeAttr(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
