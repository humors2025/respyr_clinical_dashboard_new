// App log viewer. Served by the backend at /admin/logs; data comes from
// /admin/api/logs* (routes/admin-logs.js) with the admin key in X-Admin-Key.
// Every log field is untrusted text (the app can post logs before login), so
// data only ever reaches the page through textContent, never innerHTML.
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const KEY_STORAGE = 'respyr-admin-key';   // shared with the create-clinic page
  const FILTERS = ['q', 'level', 'login_id', 'install_id', 'platform', 'app_version', 'tag', 'from', 'to'];
  const TEXT_FILTERS = new Set(['q', 'login_id', 'install_id']);
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

  // ---------------------------------------------------------------- time
  const fmtIST = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const fmtTime = (ts) => (ts ? fmtIST.format(new Date(ts * 1000)) : '—');
  const nf = new Intl.NumberFormat('en-IN');

  function relative(ts) {
    if (!ts) return '';
    const s = Math.max(0, Math.round(Date.now() / 1000 - ts));
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + ' min ago';
    if (s < 86400) return Math.floor(s / 3600) + ' h ago';
    const d = Math.floor(s / 86400);
    return d + (d === 1 ? ' day ago' : ' days ago');
  }

  // <input type="date"> values are calendar days in IST.
  function dayStartIST(ymd) {
    const t = Date.parse(ymd + 'T00:00:00+05:30');
    return Number.isNaN(t) ? null : Math.floor(t / 1000);
  }

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

  function ensureOption(select, value) {
    if (value && ![...select.options].some((o) => o.value === value)) select.append(new Option(value, value));
  }

  function fillControls() {
    FILTERS.forEach((k) => {
      const input = $('f-' + k);
      if (input.tagName === 'SELECT') ensureOption(input, state.filters[k]);
      input.value = state.filters[k] || '';
    });
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

  function listQuery() {
    const p = new URLSearchParams();
    ['q', 'level', 'login_id', 'install_id', 'platform', 'app_version', 'tag'].forEach((k) => {
      if (state.filters[k]) p.set(k, state.filters[k]);
    });
    const from = state.filters.from && dayStartIST(state.filters.from);
    const to = state.filters.to && dayStartIST(state.filters.to);
    if (from) p.set('from', from);
    if (to) p.set('to', to + 86400);   // "To" includes that whole day
    p.set('page', state.page);
    p.set('limit', state.limit);
    return p.toString();
  }

  // ---------------------------------------------------------------- list
  function levelBadge(level) {
    const known = ['error', 'warn', 'info'].includes(level);
    return el('span', 'level-badge' + (known ? ' level-' + level : ''), level || '—');
  }

  function renderRows(rows) {
    const body = $('log-rows');
    body.replaceChildren(...rows.map((r) => {
      const tr = el('tr', 'log-row');
      tr.tabIndex = 0;
      tr.dataset.id = String(r.id);
      tr.setAttribute('aria-expanded', 'false');

      const time = el('td', 'col-time');
      time.append(el('span', 'time-main', fmtTime(r.received_ts)), el('span', 'time-sub', relative(r.received_ts)));
      if (r.received_ts) time.title = new Date(r.received_ts * 1000).toISOString() + ' (UTC)';

      const level = el('td', 'col-level');
      level.append(levelBadge(r.level));

      const tag = el('td', 'col-tag');
      tag.append(r.tag ? el('span', 'cell-tag', r.tag) : el('span', 'muted', '—'));

      const message = el('td', 'col-message');
      const text = r.message || '';
      const truncated = r.message_length > text.length;
      message.append(el('span', 'cell-message', text ? text + (truncated ? '…' : '') : '(no message)'));
      if (r.has_stack) message.append(el('span', 'stack-pill', 'stack trace'));

      const clinic = el('td', 'col-clinic');
      clinic.append(r.login_id ? el('span', 'cell-mono', r.login_id) : el('span', 'muted', 'before login'));

      const app = el('td', 'col-app');
      const appText = [r.platform, r.app_version].filter(Boolean).join(' · ');
      app.append(appText ? el('span', 'cell-mono', appText) : el('span', 'muted', '—'));

      tr.append(time, level, tag, message, clinic, app);
      return tr;
    }));
    $('table-wrap').hidden = rows.length === 0;
  }

  function renderMeta(d) {
    const meta = $('results-meta');
    if (!d.total) {
      meta.textContent = '0 entries';
      return;
    }
    const first = (d.page - 1) * d.limit + 1;
    const last = Math.min(d.total, d.page * d.limit);
    meta.replaceChildren(
      'Showing ', el('strong', null, nf.format(first) + '–' + nf.format(last)),
      ' of ', el('strong', null, nf.format(d.total)), d.total === 1 ? ' entry' : ' entries'
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
      const data = await api('/admin/api/logs?' + listQuery());
      if (seq !== state.seq) return;   // a newer request has replaced this one
      state.page = data.page;          // the server clamps a page past the end
      writeUrl();
      renderRows(data.data);
      renderMeta(data);
      renderPager(data);
      showState(data.total ? null : {
        title: 'No logs found',
        text: hasFilters()
          ? 'Nothing matches these filters. Try clearing some of them.'
          : 'The app has not sent any logs in the last 60 days.',
      });
    } catch (err) {
      if (seq !== state.seq) return;
      if (err instanceof LockedError) return lock(err.message);
      renderRows([]);
      $('results-meta').textContent = '';
      $('pager').hidden = true;
      showState({ title: 'Could not load logs', text: err.message, error: true });
    } finally {
      if (seq === state.seq) setLoading(false);
    }
  }

  function goToPage(page) {
    state.page = page;
    load();
    document.querySelector('.results').scrollIntoView({ block: 'start' });
  }

  function applyFilter(changes) {
    Object.assign(state.filters, changes);
    state.page = 1;
    fillControls();
    load();
    window.scrollTo(0, 0);
  }

  // ---------------------------------------------------------------- one entry
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
  }

  function detailFields(e) {
    return [
      ['Received', e.received_ts ? fmtTime(e.received_ts) + ' IST' : '—'],
      ['Happened on device', e.happened_ts ? fmtTime(e.happened_ts) + ' IST' : '—'],
      ['Level', e.level],
      ['Tag', e.tag],
      ['Clinic login ID', e.login_id || 'before login'],
      ['Profile ID', e.profile_id],
      ['Install ID', e.install_id],
      ['Device ID', e.device_id],
      ['Platform', e.platform],
      ['App version', e.app_version],
      ['Log ID', String(e.id)],
    ];
  }

  function detailText(e) {
    const lines = detailFields(e).map(([k, v]) => k + ': ' + (v || '—'));
    lines.push('', 'Message:', e.message || '(no message)');
    if (e.stack) lines.push('', 'Stack trace:', e.stack);
    return lines.join('\n');
  }

  function actionButton(label, onClick) {
    const b = el('button', 'btn-secondary btn-sm', label);
    b.type = 'button';
    b.addEventListener('click', onClick);
    return b;
  }

  function renderDetail(e) {
    const grid = el('dl', 'detail-grid');
    detailFields(e).forEach(([k, v]) => {
      const item = el('div');
      item.append(el('dt', null, k), el('dd', null, v || '—'));
      grid.append(item);
    });

    const message = el('div', 'detail-block');
    message.append(el('h3', null, 'Message'), el('pre', 'detail-pre message', e.message || '(no message)'));
    const parts = [grid, message];

    if (e.stack) {
      const stack = el('div', 'detail-block');
      stack.append(el('h3', null, 'Stack trace'), el('pre', 'detail-pre stack', e.stack));
      parts.push(stack);
    }

    const actions = el('div', 'detail-actions');
    if (e.login_id) actions.append(actionButton("Show this clinic's logs", () => applyFilter({ login_id: e.login_id })));
    if (e.install_id) actions.append(actionButton("Show this install's logs", () => applyFilter({ install_id: e.install_id })));
    const copy = actionButton('Copy details', async () => {
      await copyText(detailText(e));
      copy.textContent = 'Copied ✓';
      setTimeout(() => { copy.textContent = 'Copy details'; }, 2000);
    });
    actions.append(copy);
    parts.push(actions);
    return parts;
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
    cell.colSpan = 6;
    const box = el('div', 'detail');
    box.append(el('p', 'detail-note', 'Loading…'));
    cell.append(box);
    detailRow.append(cell);
    tr.after(detailRow);

    const id = tr.dataset.id;
    try {
      let entry = detailCache.get(id);
      if (!entry) {
        entry = (await api('/admin/api/logs/' + encodeURIComponent(id))).data;
        detailCache.set(id, entry);
      }
      if (detailRow.isConnected) box.replaceChildren(...renderDetail(entry));
    } catch (err) {
      if (err instanceof LockedError) return lock(err.message);
      box.replaceChildren(el('p', 'detail-note', err.message));
    }
  }

  // ---------------------------------------------------------------- facets
  async function loadFacets() {
    let facets;
    try {
      facets = await api('/admin/api/logs/facets');
    } catch (err) {
      if (err instanceof LockedError) throw err;
      return;   // dropdowns stay at "All …"; the list reports its own errors
    }
    [['platform', 'All platforms'], ['app_version', 'All versions'], ['tag', 'All tags']].forEach(([k, all]) => {
      const select = $('f-' + k);
      const options = [new Option(all, '')].concat(
        (facets[k] || []).map((f) => new Option(f.value + ' (' + nf.format(f.count) + ')', f.value))
      );
      select.replaceChildren(...options);
      ensureOption(select, state.filters[k]);
      select.value = state.filters[k] || '';
    });
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
      await loadFacets();   // also proves the key
      store.set(key);
      $('gate').hidden = true;
      $('viewer').hidden = false;
      fillControls();
      await load();
    } catch (err) {
      lock(err.message);
    } finally {
      button.disabled = false;
      button.textContent = 'Open logs';
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
    if (TEXT_FILTERS.has(k)) {
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
    } else {
      input.addEventListener('change', apply);
    }
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
    loadFacets().catch((err) => { if (err instanceof LockedError) lock(err.message); });
  });
  $('lock-btn').addEventListener('click', () => {
    lock('');
    $('gate-key').value = '';
  });

  $('log-rows').addEventListener('click', (e) => {
    const row = e.target.closest('.log-row');
    if (row) toggleRow(row);
  });
  $('log-rows').addEventListener('keydown', (e) => {
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
