// Create-clinic admin page. Served by the backend at /admin/create_clinic and
// posts back to the same URL; see routes/admin.js for what the server does.
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const MAX_LOGO_BYTES = 2 * 1024 * 1024;
  const FIELD_IDS = [
    'admin_key', 'clinic_name', 'phone_no', 'email', 'location', 'test_limit',
    'test_no', 'password', 'confirm_password', 'logo_src', 'report_logo_src',
  ];
  const DASHBOARD_URL = document.body.dataset.dashboardUrl || '';
  const KEY_STORAGE = 'respyr-admin-key';   // shared with the logs page, this tab only
  let welcomeMessage = '';

  function rememberKey(key) {
    try { sessionStorage.setItem(KEY_STORAGE, key); } catch (e) { /* just not remembered */ }
  }
  function rememberedKey() {
    try { return sessionStorage.getItem(KEY_STORAGE) || ''; } catch (e) { return ''; }
  }

  const value = (id) => $(id).value.trim();
  const cleanPhone = (raw) => raw.replace(/[\s-]/g, '');

  function setFieldError(id, message) {
    const input = $(id);
    const note = document.querySelector('.field-error[data-for="' + id + '"]');
    input.classList.toggle('error', Boolean(message));
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (note) {
      note.textContent = message || '';
      note.hidden = !message;
    }
  }

  function showFormError(message) {
    const box = $('form-error');
    box.textContent = message || '';
    box.hidden = !message;
  }

  function setBusy(busy) {
    const button = $('submit-btn');
    button.disabled = busy;
    button.querySelector('.spinner').hidden = !busy;
    button.querySelector('.btn-label').textContent = busy ? 'Creating…' : 'Create clinic';
  }

  // Eye buttons on the admin key and password fields.
  function setRevealed(button, revealed) {
    const input = $(button.dataset.target);
    input.type = revealed ? 'text' : 'password';
    button.setAttribute('aria-pressed', String(revealed));
    button.setAttribute('aria-label', (revealed ? 'Hide ' : 'Show ') + button.dataset.name);
    // toggleAttribute, not .hidden: the icons are SVG elements, which have no
    // `hidden` property (assigning it would silently do nothing).
    button.querySelector('.icon-eye').toggleAttribute('hidden', revealed);
    button.querySelector('.icon-eye-off').toggleAttribute('hidden', !revealed);
  }

  function onEyeClick(event) {
    const button = event.currentTarget;
    const input = $(button.dataset.target);
    setRevealed(button, input.type === 'password');
    // Keep typing where it was.
    const end = input.value.length;
    input.focus();
    input.setSelectionRange(end, end);
  }

  function toggleTestCount() {
    const limited = $('test_limit').value === 'true';
    $('test_no_group').hidden = !limited;
    if (!limited) {
      $('test_no').value = '';
      setFieldError('test_no', '');
    }
  }

  // Same rules the server enforces, so most mistakes are caught before upload.
  function validate() {
    const errors = {};
    if (!value('admin_key')) errors.admin_key = 'Enter the admin key.';

    const name = value('clinic_name');
    if (name.length < 2) errors.clinic_name = 'Enter a login ID of at least 2 characters.';

    if (!/^\+?\d{7,15}$/.test(cleanPhone(value('phone_no')))) {
      errors.phone_no = 'Enter a valid phone number (digits, optional + at the start).';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value('email'))) errors.email = 'Enter a valid email address.';
    if (!value('location')) errors.location = 'Enter the location.';

    const limit = value('test_limit');
    if (limit !== 'true' && limit !== 'false') errors.test_limit = 'Choose a test limit.';
    if (limit === 'true') {
      const n = Number(value('test_no'));
      if (!Number.isInteger(n) || n < 1) errors.test_no = 'Enter a whole number, 1 or more.';
    }

    const password = value('password');
    if (password.length < 6) errors.password = 'Password must be at least 6 characters.';
    else if (password.length > 72) errors.password = 'Password must be 72 characters or fewer.';
    if (password !== value('confirm_password')) errors.confirm_password = 'Passwords do not match.';

    ['logo_src', 'report_logo_src'].forEach((id) => {
      const file = $(id).files[0];
      if (!file) return;
      if (!/^image\/(png|jpeg)$/.test(file.type)) errors[id] = 'Use a PNG or JPEG image.';
      else if (file.size > MAX_LOGO_BYTES) errors[id] = 'Image must be 2 MB or smaller.';
    });

    FIELD_IDS.forEach((id) => setFieldError(id, errors[id] || ''));
    const first = FIELD_IDS.find((id) => errors[id]);
    if (first) $(first).focus();
    return !first;
  }

  function buildWelcomeMessage(v) {
    return [
      'Hey, ' + v.clinic_name + '!',
      '',
      'We’ve generated your admin credentials.',
      'Please find all the details below:',
      '',
      '🔗 Dashboard Link: ' + DASHBOARD_URL,
      '👤 Admin Name: ' + v.clinic_name,
      '🔐 Temporary Password: ' + v.password,
      '📧 Email: ' + v.email,
      '📱 Phone Number (for app login): ' + v.phone_no,
      '',
      'Welcome aboard!',
      '— Team Respyr',
    ].join('\n');
  }

  function showSuccess(v, data) {
    welcomeMessage = buildWelcomeMessage(v);
    $('welcome-message').textContent = welcomeMessage;

    const logos = [data.logos && data.logos.dashboard ? 'dashboard' : null,
                   data.logos && data.logos.report ? 'report' : null].filter(Boolean);
    const rows = [
      ['Login ID', data.clinic_name],
      ['Clinic ID', data.clinical_id != null ? String(data.clinical_id) : '—'],
      ['Test limit', data.test_limit],
      ['Logos', logos.length ? logos.join(' + ') : 'none'],
    ];
    const summary = $('summary');
    summary.replaceChildren(...rows.map(([label, val]) => {
      const row = document.createElement('div');
      row.className = 'info-row';
      const dot = document.createElement('span');
      dot.className = 'info-dot';
      const l = document.createElement('span');
      l.className = 'info-label';
      l.textContent = label;
      const r = document.createElement('span');
      r.className = 'info-value';
      r.textContent = val;
      row.append(dot, l, r);
      return row;
    }));

    $('create-card').hidden = true;
    $('success-card').hidden = false;
    window.scrollTo(0, 0);
  }

  async function onSubmit(event) {
    event.preventDefault();
    showFormError('');
    if (!validate()) return;

    const v = {
      clinic_name: value('clinic_name'),
      phone_no: cleanPhone(value('phone_no')),
      email: value('email'),
      location: value('location'),
      password: value('password'),
      test_allow: value('test_limit'),
      test_no: value('test_limit') === 'true' ? value('test_no') : '0',
    };
    const body = new FormData();
    Object.keys(v).forEach((k) => body.append(k, v[k]));
    ['logo_src', 'report_logo_src'].forEach((id) => {
      const file = $(id).files[0];
      if (file) body.append(id, file);
    });

    setBusy(true);
    try {
      const res = await fetch(window.location.pathname.replace(/\/+$/, ''), {
        method: 'POST',
        headers: { 'X-Admin-Key': value('admin_key') },
        body,
      });
      let data;
      try {
        data = await res.json();
      } catch (e) {
        data = { status: 'error', message: 'The server answered ' + res.status + ' without details.' };
      }
      if (res.ok && data.status === 'success') {
        rememberKey(value('admin_key'));   // proven correct
        showSuccess(v, data);
      } else {
        showFormError(data.message || 'Request failed (' + res.status + ').');
        if (res.status === 401) setFieldError('admin_key', 'Wrong admin key.');
        if (res.status === 409 && /phone/i.test(data.message || '')) setFieldError('phone_no', 'Already in use.');
        else if (res.status === 409) setFieldError('clinic_name', 'Already in use.');
      }
    } catch (e) {
      showFormError('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function copyMessage() {
    const button = $('copy-btn');
    try {
      await navigator.clipboard.writeText(welcomeMessage);
    } catch (e) {
      const area = document.createElement('textarea');
      area.value = welcomeMessage;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    button.textContent = 'Copied ✓';
    setTimeout(() => { button.textContent = 'Copy message'; }, 2000);
  }

  // Keeps the admin key so several clinics can be created in one sitting.
  function createAnother() {
    FIELD_IDS.filter((id) => id !== 'admin_key').forEach((id) => {
      $(id).value = '';
      setFieldError(id, '');
    });
    toggleTestCount();
    // New clinic, new password: start hidden again (the admin key keeps its state).
    document.querySelectorAll('.eye-toggle:not([data-target="admin_key"])').forEach((b) => setRevealed(b, false));
    showFormError('');
    $('success-card').hidden = true;
    $('create-card').hidden = false;
    $('clinic_name').focus();
  }

  $('clinic-form').addEventListener('submit', onSubmit);
  $('test_limit').addEventListener('change', toggleTestCount);
  $('copy-btn').addEventListener('click', copyMessage);
  $('another-btn').addEventListener('click', createAnother);
  document.querySelectorAll('.eye-toggle').forEach((b) => b.addEventListener('click', onEyeClick));
  $('admin_key').value = rememberedKey();
})();
