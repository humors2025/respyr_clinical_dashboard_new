// Sensor-data viewer. Served by the backend at /admin/sensors; data comes from
// /admin/api/sensors* (routes/admin-sensors.js) with the admin key in
// X-Admin-Key. Every value is untrusted device text, so data only ever reaches
// the page through textContent, never innerHTML.
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const KEY_STORAGE = 'respyr-admin-key';   // shared with the other admin pages
  const FILTERS = ['login', 'hwid'];
  const LIMITS = [25, 50, 100, 200];
  const DEFAULT_LIMIT = 50;

  const state = { key: '', page: 1, limit: DEFAULT_LIMIT, filters: {}, seq: 0 };
  const detailCache = new Map();

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

  const nf = new Intl.NumberFormat('en-IN');
  const num = (v) => {
    if (v === null || v === undefined || v === '') return '—';
    const n = Number(v);
    return Number.isFinite(n) ? String(Math.round(n * 100) / 100) : String(v);
  };

  // ---------------------------------------------------------------- URL <-> state
  // Filters and page live in the address bar, so a refresh or a shared link
  // opens the same view. The admin key never goes there.
  function readUrl() {
    const p = new URLSearchParams(location.search);
    FILTERS.forEach((k) => { state.filters[k] = (p.get(k) || '').trim(); });
    state.page = Math.max(1, parseInt(p.get('page'), 10) || 1);
    const limit = parseInt(p.get('limit'), 10);
    state.limit = LIMITS.includes(limit) ? limit : DEFAULT_LIMIT;
  }

  function writeUrl() {
    const p = new URLSearchParams();
    FILTERS.forEach((k) => { if (state.filters[k]) p.set(k, state.filters[k]); });
    if (state.page > 1) p.set('page', state.page);
    if (state.limit !== DEFAULT_LIMIT) p.set('limit', state.limit);
    const qs = p.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
  }

  function fillControls() {
    FILTERS.forEach((k) => { $('f-' + k).value = state.filters[k] || ''; });
    $('f-limit').value = String(state.limit);
  }

  const hasFilters = () => FILTERS.some((k) => state.filters[k]);

  // ---------------------------------------------------------------- API
  class LockedError extends Error {}

  async function api(path) {
    const res = await fetch(path, { headers: { 'X-Admin-Key': state.key }, cache: 'no-store' });
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

  function filterQuery() {
    const p = new URLSearchParams();
    FILTERS.forEach((k) => { if (state.filters[k]) p.set(k, state.filters[k]); });
    return p;
  }

  function listQuery() {
    const p = filterQuery();
    p.set('page', state.page);
    p.set('limit', state.limit);
    return p.toString();
  }

  // ---------------------------------------------------------------- list
  function renderRows(rows) {
    const body = $('sensor-rows');
    body.replaceChildren(...rows.map((r) => {
      const tr = el('tr', 'log-row');
      tr.tabIndex = 0;
      tr.dataset.id = String(r.id);
      tr.setAttribute('aria-expanded', 'false');

      const time = el('td', 'col-stime');
      time.append(el('span', 'cell-dttm', r.dttm || '—'), el('span', 'time-sub', '#' + r.id));

      const clinic = el('td', 'col-slogin');
      clinic.append(r.login_details ? el('span', 'cell-mono', r.login_details) : el('span', 'muted', '—'));

      const hwid = el('td', 'col-shwid');
      hwid.append(r.hwid ? el('span', 'cell-mono', r.hwid) : el('span', 'muted', '—'));
      if (r.has_fvc) hwid.append(el('span', 'fvc-pill', 'FVC'));

      const cells = [
        num(r.acetone_ppm), num(r.Ethanol_PPM), num(r.H2_PPM),
        num(r.base_temp) + ' → ' + num(r.final_temp),
        num(r.base_humid) + ' → ' + num(r.final_humid),
      ];
      tr.append(time, clinic, hwid, ...cells.map((v, i) => {
        const td = el('td', 'col-num' + (i >= 3 ? ' col-temp' : ''));
        td.append(el('span', 'num-main', v));
        return td;
      }));
      return tr;
    }));
    $('table-wrap').hidden = rows.length === 0;
  }

  function renderMeta(d) {
    const meta = $('results-meta');
    if (!d.total) {
      meta.textContent = '0 readings';
      return;
    }
    const first = (d.page - 1) * d.limit + 1;
    const last = Math.min(d.total, d.page * d.limit);
    meta.replaceChildren(
      'Showing ', el('strong', null, nf.format(first) + '–' + nf.format(last)),
      ' of ', el('strong', null, nf.format(d.total)), d.total === 1 ? ' reading' : ' readings'
    );
  }

  // 1 … 4 5 6 … 20, always showing the first, last and neighbours of the current page.
  function pageList(cur, pages) {
    const keep = new Set([1, pages, cur - 1, cur, cur + 1]);
    if (cur <= 4) [2, 3, 4, 5].forEach((n) => keep.add(n));
    if (cur >= pages - 3) [pages - 4, pages - 3, pages - 2, pages - 1].forEach((n) => keep.add(n));
    const sorted = [...keep].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
    const out = [];
    sorted.forEach((n, i) => {
      if (i > 0 && n - sorted[i - 1] > 1) out.push('gap');
      out.push(n);
    });
    return out;
  }

  function renderPager(d) {
    const nav = $('pager');
    if (d.pages <= 1) {
      nav.hidden = true;
      nav.replaceChildren();
      return;
    }
    const button = (label, page, opts) => {
      const b = el('button', null, label);
      b.type = 'button';
      if (opts.current) b.setAttribute('aria-current', 'page');
      if (opts.disabled) b.disabled = true;
      b.setAttribute('aria-label', opts.aria);
      b.addEventListener('click', () => goToPage(page));
      return b;
    };
    const items = [button('‹ Prev', d.page - 1, { disabled: d.page <= 1, aria: 'Previous page' })];
    pageList(d.page, d.pages).forEach((n) => {
      items.push(n === 'gap'
        ? el('span', 'gap', '…')
        : button(String(n), n, { current: n === d.page, aria: 'Page ' + n }));
    });
    items.push(button('Next ›', d.page + 1, { disabled: d.page >= d.pages, aria: 'Next page' }));
    nav.replaceChildren(...items);
    nav.hidden = false;
  }

  function showState(s) {
    const box = $('state');
    if (!s) {
      box.hidden = true;
      box.replaceChildren();
      return;
    }
    box.classList.toggle('is-error', Boolean(s.error));
    box.replaceChildren(el('span', 'state-title', s.title), el('span', null, s.text));
    box.hidden = false;
  }

  function setLoading(on) {
    $('table-wrap').classList.toggle('is-loading', on);
    $('refresh-btn').classList.toggle('is-spinning', on);
  }

  async function load() {
    const seq = ++state.seq;
    writeUrl();
    setLoading(true);
    try {
      const data = await api('/admin/api/sensors?' + listQuery());
      if (seq !== state.seq) return;   // a newer request has replaced this one
      state.page = data.page;          // the server clamps a page past the end
      writeUrl();
      renderRows(data.data);
      renderMeta(data);
      renderPager(data);
      showState(data.total ? null : {
        title: 'No readings found',
        text: hasFilters()
          ? 'Nothing matches these filters. Try clearing some of them.'
          : 'The table has no rows yet.',
      });
    } catch (err) {
      if (seq !== state.seq) return;
      if (err instanceof LockedError) return lock(err.message);
      renderRows([]);
      $('results-meta').textContent = '';
      $('pager').hidden = true;
      showState({ title: 'Could not load sensor data', text: err.message, error: true });
    } finally {
      if (seq === state.seq) setLoading(false);
    }
  }

  function goToPage(page) {
    state.page = page;
    load();
    document.querySelector('.results').scrollIntoView({ block: 'start' });
  }

  // ---------------------------------------------------------------- download
  // fetch + blob, not a plain link: the admin key travels in a header, which an
  // <a href> cannot carry.
  async function download() {
    const button = $('download-btn');
    button.disabled = true;
    try {
      const res = await fetch('/admin/api/sensors.csv?' + filterQuery().toString(), {
        headers: { 'X-Admin-Key': state.key },
        cache: 'no-store',
      });
      if (res.status === 401 || res.status === 503) {
        const data = await res.json().catch(() => ({}));
        return lock(data.message || 'Admin key required.');
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return showState({ title: 'Download failed', text: data.message || 'Request failed (' + res.status + ').', error: true });
      }
      const truncated = res.headers.get('X-Truncated');
      const blob = await res.blob();
      const a = document.createElement('a');
      const name = (res.headers.get('Content-Disposition') || '').match(/filename="([^"]+)"/);
      a.href = URL.createObjectURL(blob);
      a.download = name ? name[1] : 'sensor-data.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 10000);
      if (truncated && truncated !== '0') {
        showState({
          title: 'Download capped at ' + nf.format(Number(truncated)) + ' rows',
          text: 'Narrow the filters to export the rest.',
        });
        setTimeout(() => { if (!$('state').classList.contains('is-error')) showState(null); }, 6000);
      }
    } catch (err) {
      showState({ title: 'Download failed', text: err.message, error: true });
    } finally {
      button.disabled = false;
    }
  }

  // ---------------------------------------------------------------- one reading
  function renderDetail(e) {
    const grid = el('dl', 'sensor-grid');
    Object.keys(e).forEach((k) => {
      if (k === 'Blow_fvc_fev_json') return;   // shown as its own block below
      const item = el('div');
      item.append(el('dt', null, k), el('dd', null, e[k] === null || e[k] === undefined || e[k] === '' ? '—' : String(e[k])));
      grid.append(item);
    });
    const parts = [grid];

    if (e.Blow_fvc_fev_json) {
      let text = String(e.Blow_fvc_fev_json);
      try { text = JSON.stringify(JSON.parse(text), null, 2); } catch (err) { /* keep raw */ }
      const block = el('div', 'detail-block');
      block.append(el('h3', null, 'Blow_fvc_fev_json'), el('pre', 'detail-pre stack', text));
      parts.push(block);
    }

    const actions = el('div', 'detail-actions');
    if (e.login_details) {
      const b = el('button', 'btn-secondary btn-sm', "Show this clinic's readings");
      b.type = 'button';
      b.addEventListener('click', () => applyFilter({ login: e.login_details }));
      actions.append(b);
    }
    if (e.hwid) {
      const b = el('button', 'btn-secondary btn-sm', "Show this device's readings");
      b.type = 'button';
      b.addEventListener('click', () => applyFilter({ hwid: e.hwid }));
      actions.append(b);
    }
    parts.push(actions);
    return parts;
  }

  function applyFilter(changes) {
    Object.assign(state.filters, changes);
    state.page = 1;
    fillControls();
    load();
    window.scrollTo(0, 0);
  }

  async function toggleRow(tr) {
    const next = tr.nextElementSibling;
    if (tr.getAttribute('aria-expanded') === 'true') {
      tr.setAttribute('aria-expanded', 'false');
      if (next && next.classList.contains('detail-row')) next.remove();
      return;
    }
    tr.setAttribute('aria-expanded', 'true');
    const detailRow = el('tr', 'detail-row');
    const cell = el('td');
    cell.colSpan = 8;
    const box = el('div', 'detail');
    box.append(el('p', 'detail-note', 'Loading…'));
    cell.append(box);
    detailRow.append(cell);
    tr.after(detailRow);

    const id = tr.dataset.id;
    try {
      let entry = detailCache.get(id);
      if (!entry) {
        entry = (await api('/admin/api/sensors/' + encodeURIComponent(id))).data;
        detailCache.set(id, entry);
      }
      if (detailRow.isConnected) box.replaceChildren(...renderDetail(entry));
    } catch (err) {
      if (err instanceof LockedError) return lock(err.message);
      box.replaceChildren(el('p', 'detail-note', err.message));
    }
  }

  // ---------------------------------------------------------------- key gate
  function showGate(message) {
    $('viewer').hidden = true;
    $('gate').hidden = false;
    const error = $('gate-error');
    error.textContent = message || '';
    error.hidden = !message;
    $('gate-key').classList.toggle('error', Boolean(message));
    $('gate-key').focus();
  }

  function lock(message) {
    state.key = '';
    state.seq++;   // drop any request still in flight
    store.clear();
    detailCache.clear();
    showGate(message);
  }

  async function unlock(key) {
    state.key = key;
    const button = $('gate-btn');
    button.disabled = true;
    button.textContent = 'Checking…';
    try {
      $('gate').hidden = true;
      $('viewer').hidden = false;
      fillControls();
      await load();   // a wrong key surfaces as LockedError and re-locks
      if (state.key) store.set(key);
    } finally {
      button.disabled = false;
      button.textContent = 'Open sensor data';
    }
  }

  // ---------------------------------------------------------------- eye toggle
  function setRevealed(button, revealed) {
    $(button.dataset.target).type = revealed ? 'text' : 'password';
    button.setAttribute('aria-pressed', String(revealed));
    button.setAttribute('aria-label', (revealed ? 'Hide ' : 'Show ') + button.dataset.name);
    // toggleAttribute: SVG elements have no `hidden` property.
    button.querySelector('.icon-eye').toggleAttribute('hidden', revealed);
    button.querySelector('.icon-eye-off').toggleAttribute('hidden', !revealed);
  }

  // ---------------------------------------------------------------- wiring
  const timers = {};
  FILTERS.forEach((k) => {
    const input = $('f-' + k);
    const apply = () => {
      const v = input.value.trim();
      if (v === (state.filters[k] || '')) return;
      state.filters[k] = v;
      state.page = 1;
      load();
    };
    input.addEventListener('input', () => {
      clearTimeout(timers[k]);
      timers[k] = setTimeout(apply, 350);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(timers[k]);
        apply();
      }
    });
  });

  $('filters').addEventListener('submit', (e) => e.preventDefault());
  $('f-limit').addEventListener('change', () => {
    state.limit = parseInt($('f-limit').value, 10) || DEFAULT_LIMIT;
    state.page = 1;
    load();
  });
  $('clear-btn').addEventListener('click', () => {
    FILTERS.forEach((k) => { state.filters[k] = ''; });
    state.page = 1;
    fillControls();
    load();
  });
  $('refresh-btn').addEventListener('click', () => {
    detailCache.clear();
    load();
  });
  $('download-btn').addEventListener('click', download);
  $('lock-btn').addEventListener('click', () => {
    lock('');
    $('gate-key').value = '';
  });

  $('sensor-rows').addEventListener('click', (e) => {
    const row = e.target.closest('.log-row');
    if (row) toggleRow(row);
  });
  $('sensor-rows').addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('log-row')) {
      e.preventDefault();
      toggleRow(e.target);
    }
  });

  $('gate-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const key = $('gate-key').value.trim();
    if (!key) return showGate('Enter the admin key.');
    unlock(key);
  });
  document.querySelectorAll('.eye-toggle').forEach((b) => b.addEventListener('click', () => {
    setRevealed(b, $(b.dataset.target).type === 'password');
    $(b.dataset.target).focus();
  }));

  readUrl();
  fillControls();
  const saved = store.get();
  if (saved) unlock(saved);
  else showGate('');
})();
