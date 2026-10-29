// USB access manager. Served at /admin/usb; data via /admin/api/usb
// (routes/admin-usb.js) with the admin key in X-Admin-Key. Login ids are
// untrusted text and only ever reach the page through textContent.
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const KEY_STORAGE = 'respyr-admin-key';   // shared with the other admin pages

  const state = { key: '' };

  // sessionStorage can be unavailable (private mode, blocked storage).
  const store = {
    get() { try { return sessionStorage.getItem(KEY_STORAGE) || ''; } catch (e) { return ''; } },
    set(v) { try { sessionStorage.setItem(KEY_STORAGE, v); } catch (e) { /* just not remembered */ } },
    clear() { try { sessionStorage.removeItem(KEY_STORAGE); } catch (e) { /* nothing to clear */ } },
  };

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  class LockedError extends Error {}

  async function api(path, options) {
    const opts = options || {};
    opts.headers = Object.assign({ 'X-Admin-Key': state.key }, opts.headers || {});
    opts.cache = 'no-store';
    const res = await fetch(path, opts);
    let data;
    try {
      data = await res.json();
    } catch (e) {
      data = { status: 'error', message: 'The server answered ' + res.status + ' without details.' };
    }
    if (res.status === 401 || res.status === 503) throw new LockedError(data.message || 'Admin key required.');
    if (!res.ok || data.status !== 'success') throw new Error(data.message || 'Request failed (' + res.status + ').');
    return data;
  }

  // ---------------------------------------------------------------- gate/lock
  function showGate(message) {
    $('viewer').hidden = true;
    $('gate').hidden = false;
    const err = $('gate-error');
    if (message) { err.textContent = message; err.hidden = false; } else { err.hidden = true; }
    $('gate-key').focus();
  }

  async function unlock(key) {
    state.key = key;
    try {
      await loadList();
    } catch (e) {
      if (e instanceof LockedError) { store.clear(); showGate(e.message); return; }
      // The key worked only if the request got past the gate; any other
      // failure still means we are in — show it in the list area.
      setState(e.message || 'Could not load the list.');
    }
    store.set(key);
    $('gate').hidden = true;
    $('viewer').hidden = false;
  }

  // ---------------------------------------------------------------- list
  function setState(message) {
    const node = $('state');
    if (message) { node.textContent = message; node.hidden = false; } else { node.hidden = true; }
  }

  function fmtDate(v) {
    if (!v) return '—';
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  async function loadList() {
    setState('Loading…');
    const data = await api('/admin/api/usb');
    const rows = data.data || [];
    const body = $('usb-rows');
    body.replaceChildren();

    rows.forEach((row) => {
      const tr = el('tr');
      tr.appendChild(el('td', '', row.login_id));
      tr.appendChild(el('td', '', fmtDate(row.added_at)));

      const td = el('td', 'col-action');
      const btn = el('button', 'remove-btn', 'Remove');
      btn.type = 'button';
      btn.addEventListener('click', async () => {
        if (!confirm('Remove ' + row.login_id + '? Their app goes back to Bluetooth only.')) return;
        btn.disabled = true;
        try {
          await api('/admin/api/usb/' + encodeURIComponent(row.login_id), { method: 'DELETE' });
          await loadList();
        } catch (e) {
          btn.disabled = false;
          if (e instanceof LockedError) { store.clear(); showGate(e.message); return; }
          setState(e.message);
        }
      });
      td.appendChild(btn);
      tr.appendChild(td);
      body.appendChild(tr);
    });

    $('results-meta').textContent = rows.length === 1
      ? '1 clinic has the USB option'
      : rows.length + ' clinics have the USB option';
    setState(rows.length ? '' : 'No clinics on the list yet — everyone sees Bluetooth only.');
  }

  // ---------------------------------------------------------------- add
  function showAddResult(okMessage, errorMessage) {
    const ok = $('add-ok'), err = $('add-error');
    ok.hidden = !okMessage; if (okMessage) ok.textContent = okMessage;
    err.hidden = !errorMessage; if (errorMessage) err.textContent = errorMessage;
  }

  async function addLogin(event) {
    event.preventDefault();
    const input = $('add-login');
    const loginId = input.value.trim();
    if (!loginId) { showAddResult('', 'Enter the clinic login id first.'); return; }

    $('add-btn').disabled = true;
    try {
      const data = await api('/admin/api/usb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login_id: loginId }),
      });
      showAddResult(data.message, '');
      input.value = '';
      await loadList();
    } catch (e) {
      if (e instanceof LockedError) { store.clear(); showGate(e.message); return; }
      showAddResult('', e.message);
    } finally {
      $('add-btn').disabled = false;
    }
  }

  // ---------------------------------------------------------------- wiring
  document.addEventListener('DOMContentLoaded', () => {
    // Eye toggle on the key field, same behaviour as the other admin pages.
    document.querySelectorAll('.eye-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const input = $(btn.dataset.target);
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.setAttribute('aria-pressed', String(show));
        btn.querySelector('.icon-eye').hidden = show;
        btn.querySelector('.icon-eye-off').hidden = !show;
        input.focus();
      });
    });

    $('gate-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const key = $('gate-key').value.trim();
      if (key) unlock(key);
    });

    $('add-form').addEventListener('submit', addLogin);
    $('refresh-btn').addEventListener('click', () => loadList().catch((e) => {
      if (e instanceof LockedError) { store.clear(); showGate(e.message); return; }
      setState(e.message);
    }));
    $('lock-btn').addEventListener('click', () => { store.clear(); state.key = ''; showGate(); });

    const saved = store.get();
    if (saved) unlock(saved); else showGate();
  });
})();
