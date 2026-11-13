(() => {
  'use strict';

  // ---- EDIT THESE TWO LINES (same values as scan.html) ----------------------
  const ENDPOINT   = 'https://script.google.com/macros/s/AKfycbz5X3rZIbOklNBNlLM3IiBaiwsV0uow6vu3xKj7KzOiNkVH5G0ConDCKWD19MGkSagx8g/exec';   // the Apps Script web app URL, ends in /exec
  const SHARED_KEY = 'OSSfgQHYhEWD6rLP9b8SwqeCySAY';                // must match SHARED_KEY in Code.gs
  // ---------------------------------------------------------------------------

  const REMIND_DAYS  = 14;   // first reminder
  const RESTOCK_DAYS = 21;   // pull from shelf and refund
  // Bags packed BEFORE this date were promised the old 28 days, so they keep it.
  // Once nothing packed before this date is left on the shelf (28 days later), delete these two lines
  // and the restockDaysFor() helper below, and use RESTOCK_DAYS directly.
  const OLD_RESTOCK_DAYS = 28;
  const NEW_POLICY_START = '2026-11-13';   // YYYY-MM-DD, first pack date that gets 21 days
  const CSV_SEPARATOR = ', ';   // Arc takes "6227210, 6228949, ..."
  const EMAIL_BUILDER = '../customerEmailBuilder/index.html';
  // Insite note for a restock. {plId} and {date} are filled in; {date} is the day the tool is used.
  const RESTOCK_NOTE = 'Refunded Pack List ID {plId} on {date} due to customer not picking up';

  // Browser-only memory on this PC (fine: there's one shared PC, and the shelf scan is the real record)
  const SENT_KEY = 'pickupShelfScan.sentLocal.v1';   // "Mark sent" clicks, backup if the sheet can't be reached
  const DONE_KEY = 'pickupShelfScan.restockDone.v1'; // restock checklist ticks
  const KEEP_DAYS = 60;                               // forget marks older than this

  const $ = id => document.getElementById(id);

  let scan = null;     // { submittedAt, submittedBy, bags: [{id, stickered}] }
  let arcBags = null;  // Map plId -> grouped bag from the Arc file
  let arcFileName = '';
  const localSent = loadMarks(SENT_KEY);
  const restockDone = loadMarks(DONE_KEY);

  const configured = () => !ENDPOINT.includes('PASTE') && SHARED_KEY !== 'CHANGE-ME';

  /* ======================= small helpers ======================= */

  function loadMarks(key) {
    let marks = {};
    try { marks = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (e) { marks = {}; }
    const cutoff = Date.now() - KEEP_DAYS * 86400000;
    Object.keys(marks).forEach(id => { if (!(Date.parse(marks[id]) >= cutoff)) delete marks[id]; });
    saveMarks(key, marks);
    return marks;
  }
  function saveMarks(key, marks) { try { localStorage.setItem(key, JSON.stringify(marks)); } catch (e) {} }

  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  async function copyText(text, button, label) {
    try { await navigator.clipboard.writeText(text); button.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Copied'; }
    catch (e) { window.prompt('Copy this (Ctrl+C):', text); }
    setTimeout(() => { button.innerHTML = label; }, 1400);
  }

  /* ======================= dates ======================= */

  // All dates are plain calendar days {y, m, d}; no time zones involved.
  function todayParts() { const t = new Date(); return { y: t.getFullYear(), m: t.getMonth() + 1, d: t.getDate() }; }
  const dayNumber = p => Date.UTC(p.y, p.m - 1, p.d) / 86400000;
  const pad = n => String(n).padStart(2, '0');
  const toIso = p => `${p.y}-${pad(p.m)}-${pad(p.d)}`;
  const toUs = p => `${pad(p.m)}/${pad(p.d)}/${p.y}`;   // 11/03/2026, same as the email builder
  // Days before a bag is pulled, by the policy it was packed under.
  function restockDaysFor(pack) { return toIso(pack) >= NEW_POLICY_START ? RESTOCK_DAYS : OLD_RESTOCK_DAYS; }

  function addDays(p, n) {
    const dt = new Date(Date.UTC(p.y, p.m - 1, p.d + n));
    return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
  }

  /** Arc pack dates arrive as "2026-10-12" text today; also accept 10/12/2026 and real Excel dates. */
  function parseDate(v) {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number' && window.XLSX) {
      const c = XLSX.SSF.parse_date_code(v);
      return c ? { y: c.y, m: c.m, d: c.d } : null;
    }
    const s = String(v).trim();
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return valid({ y: +m[1], m: +m[2], d: +m[3] });
    m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (m) return valid({ y: m[3].length === 2 ? 2000 + +m[3] : +m[3], m: +m[1], d: +m[2] });
    return null;
  }
  function valid(p) { return p.m >= 1 && p.m <= 12 && p.d >= 1 && p.d <= 31 ? p : null; }

  function asOf() { return parseDate($('asOf').value) || todayParts(); }
  $('asOf').value = toIso(todayParts());

  /** The Insite note always uses the real date the tool is being used, not the "as of" date. */
  const restockNote = bag => RESTOCK_NOTE.replace('{plId}', bag.id).replace('{date}', toUs(todayParts()));

  /* ======================= step 1: shelf scan ======================= */

  function setStatus(el, cls, html) { el.className = 'form-status mt-3 ' + cls; el.innerHTML = html; }

  async function loadScan() {
    const info = $('scanInfo');
    if (!configured()) { setStatus(info, 'error', 'Not set up yet: paste the web app URL and key at the top of app.js.'); return; }
    setStatus(info, '', 'Loading…');
    try {
      const d = await (await fetch(ENDPOINT + '?action=latest', { cache: 'no-store' })).json();
      if (!d.ok) throw new Error(d.error || 'server error');
      scan = d.current;
      // Clicks saved only on this PC (sheet unreachable at the time) still count as stickered.
      scan.bags.forEach(b => { if (localSent[b.id]) b.stickered = true; });
      if (!scan.bags.length) { setStatus(info, 'error', 'No scan has been submitted yet.'); $('csvWrap').hidden = true; render(); return; }
      const stickered = scan.bags.filter(b => b.stickered).length;
      const when = scan.submittedAt ? new Date(scan.submittedAt).toLocaleString() : 'unknown time';
      setStatus(info, 'success', `<strong>${plural(scan.bags.length, 'bag')}</strong> scanned ${esc(when)}` +
        (scan.submittedBy ? ` by ${esc(scan.submittedBy)}` : '') + ` · ${stickered} with pink sticker.` +
        (d.previousCount ? ` <span class="text-muted">(Scan before that: ${plural(d.previousCount, 'bag')}.)</span>` : ''));
      $('csvLine').value = scan.bags.map(b => b.id).join(CSV_SEPARATOR);
      $('csvWrap').hidden = false;
      $('copyStatus').textContent = '';
      render();
    } catch (e) {
      setStatus(info, 'error', 'Could not load the scan: ' + esc(e.message));
    }
  }

  async function post(body) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },   // avoids a CORS preflight
      body: JSON.stringify(Object.assign({ key: SHARED_KEY }, body))
    });
    return res.json();
  }

  $('loadScan').addEventListener('click', loadScan);

  $('undoScan').addEventListener('click', async () => {
    if (!configured()) { setStatus($('scanInfo'), 'error', 'Not set up yet.'); return; }
    if (!confirm('Undo the last submitted scan and go back to the one before it?')) return;
    try {
      const d = await post({ action: 'undo' });
      if (!d.ok) throw new Error(d.error);
      await loadScan();
    } catch (e) { setStatus($('scanInfo'), 'error', 'Undo failed: ' + esc(e.message)); }
  });

  $('copyCsv').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText($('csvLine').value);
      $('copyStatus').textContent = `Copied ${plural(scan.bags.length, 'PL ID')}. Paste into Arc.`;
    } catch (e) {
      $('csvLine').select();
      $('copyStatus').textContent = 'Selected. Press Ctrl+C to copy.';
    }
  });

  /* ======================= step 2: Arc file ======================= */

  const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
  const COLS = {   // normalized header -> our field
    plid: 'plId', packinglistid: 'plId', firstname: 'first', lastname: 'last', ordernumber: 'order',
    orderdate: 'orderDate', packdate: 'packDate', email: 'email', item: 'item', itemdescription: 'desc'
  };
  const idText = v => (typeof v === 'number' ? String(Math.round(v)) : String(v || '').trim());

  function readArc(file) {
    arcFileName = file.name;
    const info = $('fileInfo');
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '', raw: true });
        if (!rows.length) throw new Error('the file has no rows');

        const map = {};
        Object.keys(rows[0]).forEach(h => { if (COLS[norm(h)]) map[h] = COLS[norm(h)]; });
        const have = new Set(Object.values(map));
        const missing = ['plId', 'packDate', 'first', 'last', 'order', 'email'].filter(f => !have.has(f));
        if (!have.has('plId') || !have.has('packDate')) {
          throw new Error('could not find the "PL ID" and "Pack Date" columns. Is this the Arc file?');
        }

        arcBags = new Map();
        rows.forEach(raw => {
          const r = {};
          Object.entries(map).forEach(([h, f]) => { r[f] = raw[h]; });
          const id = idText(r.plId);
          if (!id) return;
          let bag = arcBags.get(id);
          if (!bag) {
            bag = { id, first: String(r.first || '').trim(), last: String(r.last || '').trim(),
                    order: idText(r.order), email: String(r.email || '').trim(),
                    pack: parseDate(r.packDate), items: [], mixedDates: false };
            arcBags.set(id, bag);
          } else {
            const p = parseDate(r.packDate);
            if (p && bag.pack && dayNumber(p) !== dayNumber(bag.pack)) {
              bag.mixedDates = true;
              if (dayNumber(p) < dayNumber(bag.pack)) bag.pack = p;   // use the oldest date
            }
          }
          const desc = String(r.desc || '').trim();
          bag.items.push(desc ? `${desc}${r.item ? ' (' + idText(r.item) + ')' : ''}` : idText(r.item));
        });

        setStatus(info, 'success', `${esc(arcFileName)}: ${plural(rows.length, 'row')}, ${plural(arcBags.size, 'bag')} (PL IDs).` +
          (missing.length ? ` Missing columns: ${esc(missing.join(', '))}.` : ''));
        $('dropText').innerHTML = `<strong>${esc(arcFileName)}</strong> loaded. Choose another to replace it.`;
        render();
      } catch (err) {
        arcBags = null;
        setStatus(info, 'error', 'Could not read that file: ' + esc(err.message));
        render();
      }
    };
    reader.readAsArrayBuffer(file);
  }

  $('arcFile').addEventListener('change', e => { if (e.target.files[0]) readArc(e.target.files[0]); e.target.value = ''; });
  const drop = $('drop');
  ['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => { if (e.dataTransfer.files[0]) readArc(e.dataTransfer.files[0]); });
  $('asOf').addEventListener('change', render);

  /* ======================= sorting into buckets ======================= */

  function isStickered(id) {
    if (localSent[id]) return true;
    const b = scan && scan.bags.find(x => x.id === id);
    return !!(b && b.stickered);
  }

  function render() {
    if (!arcBags) { $('results').hidden = true; return; }
    $('results').hidden = false;

    const today = dayNumber(asOf());
    const buckets = { restock: [], remind: [], sent: [], wait: [] };
    const noDate = [];

    arcBags.forEach(bag => {
      if (!bag.pack) { noDate.push(bag); return; }
      bag.days = today - dayNumber(bag.pack);
      bag.stickered = isStickered(bag.id);
      bag.restockDays = restockDaysFor(bag.pack);
      if (bag.days >= bag.restockDays) buckets.restock.push(bag);
      else if (bag.days >= REMIND_DAYS) (bag.stickered ? buckets.sent : buckets.remind).push(bag);
      else buckets.wait.push(bag);
    });
    Object.values(buckets).forEach(list => list.sort((a, b) => b.days - a.days || a.id.localeCompare(b.id)));

    $('summary').innerHTML = [
      [buckets.restock.length, 'To restock'], [buckets.remind.length, 'Need a reminder'],
      [buckets.sent.length, 'Already reminded'], [buckets.wait.length, 'Waiting']
    ].map(([n, label]) => `<div><dt>${label}</dt><dd>${n}</dd></div>`).join('');

    // Warnings
    const warn = [];
    if (!scan) {
      warn.push(`The shelf scan is not loaded, so pink stickers are unknown and every bag from day ${REMIND_DAYS} until restock shows as "Needs reminder". Click <strong>Load latest scan</strong> above.`);
    } else {
      const scanned = new Set(scan.bags.map(b => b.id));
      const notInArc = scan.bags.filter(b => !arcBags.has(b.id)).map(b => b.id);
      const notScanned = [...arcBags.keys()].filter(id => !scanned.has(id));
      if (notInArc.length) warn.push(`Scanned but not in the Arc file (${notInArc.length}): ${notInArc.map(esc).join(', ')}. Was the Arc file made from an older scan, or are these already picked up in Arc?`);
      if (notScanned.length) warn.push(`In the Arc file but not in the latest scan (${notScanned.length}): ${notScanned.map(esc).join(', ')}. The Arc file may be from an older scan.`);
    }
    if (noDate.length) warn.push(`No readable pack date for: ${noDate.map(b => esc(b.id)).join(', ')}. Check these by hand.`);
    const mixed = [...arcBags.values()].filter(b => b.mixedDates).map(b => b.id);
    if (mixed.length) warn.push(`Items in the same bag have different pack dates (the oldest was used): ${mixed.map(esc).join(', ')}.`);
    $('warnings').innerHTML = warn.map(w => `<div class="ps-warn"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i><div>${w}</div></div>`).join('');

    $('nRestock').textContent = `(${buckets.restock.length})`;
    $('nRemind').textContent = `(${buckets.remind.length})`;
    $('nSent').textContent = `(${buckets.sent.length})`;
    $('nWait').textContent = `(${buckets.wait.length})`;

    renderRestock(buckets.restock);
    renderRemindCards(buckets.remind);
    $('listSent').innerHTML = table(buckets.sent, 'No stickered bags in the reminder window.');
    $('listWait').innerHTML = table(buckets.wait, 'No bags under 14 days.');
  }

  const fullName = b => [b.first, b.last].filter(Boolean).join(' ') || '(no name)';

  function table(list, emptyText) {
    if (!list.length) return `<p class="empty-note">${emptyText}</p>`;
    return `<div class="table-responsive"><table class="table table-sm align-middle ps-table"><thead><tr>
      <th>PL ID</th><th>Customer</th><th>Order</th><th>Packed</th><th>Email</th><th>Days</th>
      </tr></thead><tbody>${list.map(b => `<tr>
        <td class="num">${esc(b.id)}</td><td>${esc(fullName(b))}</td><td class="num">${esc(b.order)}</td>
        <td class="num">${esc(toUs(b.pack))}</td><td>${esc(b.email)}</td><td class="num">${b.days}</td>
      </tr>`).join('')}</tbody></table></div>`;
  }

  /* ---------- restock checklist ---------- */

  const COPY_NOTE_LABEL = '<i class="fa-solid fa-copy" aria-hidden="true"></i> Copy Insite note';

  function updateRestockProgress(list) {
    const done = list.filter(b => restockDone[b.id]).length;
    $('restockProgress').textContent = list.length ? `${done} of ${list.length} done` : '';
  }

  function renderRestock(list) {
    const wrap = $('listRestock');
    updateRestockProgress(list);
    if (!list.length) { wrap.innerHTML = '<p class="empty-note">Nothing to restock.</p>'; return; }
    wrap.innerHTML = `<div class="table-responsive"><table class="table table-sm align-middle ps-table"><thead><tr>
      <th>Done</th><th>PL ID</th><th>Customer</th><th>Order</th><th>Packed</th><th>Days</th><th>Items</th><th>Insite note</th>
      </tr></thead><tbody></tbody></table></div>`;
    const body = wrap.querySelector('tbody');
    list.forEach(b => {
      const tr = document.createElement('tr');
      tr.className = restockDone[b.id] ? 'is-done' : '';
      tr.innerHTML = `
        <td><input class="form-check-input" type="checkbox" aria-label="Mark PL ID ${esc(b.id)} done" ${restockDone[b.id] ? 'checked' : ''}></td>
        <td class="num"><strong>${esc(b.id)}</strong></td><td>${esc(fullName(b))}</td><td class="num">${esc(b.order)}</td>
        <td class="num">${esc(toUs(b.pack))}</td><td class="num">${b.days}</td><td>${esc(b.items.join('; '))}</td>
        <td><button class="btn btn-outline-secondary btn-sm copy-note" type="button" title="${esc(restockNote(b))}">${COPY_NOTE_LABEL}</button></td>`;
      tr.querySelector('input').addEventListener('change', e => {
        if (e.target.checked) restockDone[b.id] = new Date().toISOString(); else delete restockDone[b.id];
        saveMarks(DONE_KEY, restockDone);
        tr.classList.toggle('is-done', e.target.checked);
        updateRestockProgress(list);
      });
      const btn = tr.querySelector('.copy-note');
      btn.addEventListener('click', () => copyText(restockNote(b), btn, COPY_NOTE_LABEL));
      body.appendChild(tr);
    });
  }

  /* ---------- reminders ---------- */

  function builderLink(b) {
    const q = new URLSearchParams({ template: 'pickupReminder', name: fullName(b), order: b.order, packed: toIso(b.pack) });
    return `${EMAIL_BUILDER}?${q.toString()}`;
  }

  const COPY_EMAIL_LABEL = '<i class="fa-solid fa-copy" aria-hidden="true"></i> Copy email';

  function renderRemindCards(list) {
    const wrap = $('listRemind');
    if (!list.length) { wrap.innerHTML = '<p class="empty-note">No reminders due.</p>'; return; }
    wrap.innerHTML = '';
    list.forEach(b => {
      const card = document.createElement('article');
      card.className = 'remind-card';
      card.innerHTML = `
        <h3>${esc(fullName(b))}</h3>
        <p class="remind-meta">PL ID <strong>${esc(b.id)}</strong> · Order #${esc(b.order)} · Packed ${esc(toUs(b.pack))} (${b.days} days) · Restock ${esc(toUs(addDays(b.pack, b.restockDays)))}</p>
        <div class="remind-email"><span>${esc(b.email || 'No email in Arc file')}</span>
          ${b.email ? `<button class="btn btn-outline-secondary btn-sm" data-copy type="button">${COPY_EMAIL_LABEL}</button>` : ''}</div>
        <ul class="remind-items">${b.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
        <div class="action-row mt-3">
          <a class="btn btn-primary btn-sm" href="${esc(builderLink(b))}" target="_blank" rel="noopener"><i class="fa-solid fa-envelope" aria-hidden="true"></i> Write reminder</a>
          <button class="btn btn-sm btn-pink" data-sent type="button"><i class="fa-solid fa-circle" aria-hidden="true"></i> Mark sent</button>
          <span class="text-muted small" data-msg role="status"></span>
        </div>`;
      const copy = card.querySelector('[data-copy]');
      if (copy) copy.addEventListener('click', () => copyText(b.email, copy, COPY_EMAIL_LABEL));
      card.querySelector('[data-sent]').addEventListener('click', e => markSent(b, card, e.currentTarget));
      wrap.appendChild(card);
    });
  }

  async function markSent(b, card, btn) {
    if (!confirm(`Mark the reminder for PL ID ${b.id} (${fullName(b)}) as sent?\n\nOnly do this after the email is sent and the pink sticker is on the bag.`)) return;
    btn.disabled = true;
    const msg = card.querySelector('[data-msg]');
    msg.textContent = 'Saving…';
    // Remember it on this PC first, so it never reappears even if the sheet can't be reached.
    localSent[b.id] = new Date().toISOString();
    saveMarks(SENT_KEY, localSent);
    let note = '';
    if (configured() && scan && scan.bags.some(x => x.id === b.id)) {
      try {
        const d = await post({ action: 'sticker', id: b.id, stickered: true });
        if (!d.ok) note = ' (saved on this PC only: ' + d.error + ')';
        else { const s = scan.bags.find(x => x.id === b.id); if (s) s.stickered = true; }
      } catch (e) { note = ' (saved on this PC only; the sheet could not be reached)'; }
    }
    card.classList.add('done');
    msg.textContent = 'Marked sent' + note + '.';
    setTimeout(render, note ? 2500 : 900);
  }

  $('printRestock').addEventListener('click', () => {
    document.body.classList.add('printing-restock');
    window.print();
    setTimeout(() => document.body.classList.remove('printing-restock'), 500);
  });

  // The day ranges shown on the page follow REMIND_DAYS and RESTOCK_DAYS at the top of this file.
  const [sy, sm, sd] = NEW_POLICY_START.split('-').map(Number);
  const startUs = toUs({ y: sy, m: sm, d: sd });
  $('ruleRestock').textContent = `${RESTOCK_DAYS}+ days since packed (${OLD_RESTOCK_DAYS}+ if packed before ${startUs})`;
  $('ruleRemind').textContent = `From day ${REMIND_DAYS} until restock, no pink sticker`;
  $('ruleSent').textContent = `From day ${REMIND_DAYS} until restock, pink sticker`;
  $('ruleWait').textContent = `Under ${REMIND_DAYS} days`;

  if (configured()) loadScan();
})();
