/**
 * Bookstore Online Department - Team Tracking (v1)
 * Lives in its own Google Sheet ("Team Tracking") on the shared supplies account.
 *
 * ORDER OF OPERATIONS (details in README.md):
 *   1. Change PIN below to the team PIN (digits only). Do this in the Apps Script editor ONLY.
 *      The copy of this file on GitHub must keep 'CHANGE-ME', because the repo is public.
 *   2. Run setup()                -> builds the Log, Daily Totals, Weekly Totals and About tabs
 *   3. Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone)
 *   4. Paste the /exec URL into orderMetrics/config.js. The PIN never goes in any page.
 *
 * HOW IT WORKS
 *   - Every tap on the phone page adds one row to Log (a "+40" tap is one row with qty 40).
 *   - The phone saves taps on the device first and sends them in small batches, so a slow
 *     connection never slows anyone down. Each tap has an id, so a retry can't double count.
 *   - "Undo last entry" deletes that one row.
 *   - Daily Totals and Weekly Totals are formulas over Log. Weeks start on Monday.
 *   - Team counts only. No names, order numbers or customer details are stored.
 */

// ---- EDIT THIS (in the Apps Script editor, never in the GitHub copy) --------
const PIN = 'CHANGE-ME';
// -----------------------------------------------------------------------------

const TZ = 'America/Denver';
const MAX_QTY = 500;            // one entry can't be more than this
const MAX_OPS = 200;            // per request
const BAD_PIN_LIMIT = 15;       // wrong PINs allowed per 10 minutes before everything locks briefly
const HEADER = ['timestamp', 'date', 'week_of', 'item', 'qty', 'key', 'entry_id', 'device'];

// Keep in sync with orderMetrics/config.js. The key is what the pages send; the label is what the sheet shows.
const ITEMS = {
  ship_cm:        'Shipping · Course Materials',
  ship_merch:     'Shipping · Merchandise',
  pickup_cm:      'Pick up at store · Course Materials',
  pickup_merch:   'Pick up at store · Merchandise',
  cancel:         'Cancellation requests',
  pending:        'Pending orders'
};
// Retired buttons (before the Course Materials / Merchandise split). Still accepted so taps
// that were waiting on a phone when the change went out are not lost.
const LEGACY_ITEMS = {
  ship_printed:   'Shipping orders printed',
  shipped:        'Shipping orders shipped',
  pickup_printed: 'Pickup orders printed',
  pickup_packed:  'Pickup orders packed',
  picked_up:      'Pickup orders picked up'
};
const CHANNELS = { call: 'Phone call', voicemail: 'Voicemail', email: 'Email' };
const SUBJECTS = {
  order_status: 'Order status', textbook: 'Textbook question', merch: 'Merch question',
  general: 'General question', returns: 'Returns', other: 'Other'
};

function labelFor_(key) {
  if (ITEMS[key]) return ITEMS[key];
  if (LEGACY_ITEMS[key]) return LEGACY_ITEMS[key];
  const p = String(key).split('.');
  if (p.length === 2 && CHANNELS[p[0]] && SUBJECTS[p[1]]) return CHANNELS[p[0]] + ' · ' + SUBJECTS[p[1]];
  return null;
}

/* ============================ ONE-TIME SETUP ============================== */

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss.getSheetByName('Log')) {
    throw new Error('Setup has already been run (a Log tab exists). Delete it first if you really want to start over.');
  }
  ss.setSpreadsheetTimeZone(TZ);
  const starter = ss.getSheets()[0];

  const log = ss.insertSheet('Log');
  log.getRange(1, 1, 1, HEADER.length).setValues([HEADER]).setFontWeight('bold');
  log.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm:ss');
  log.getRange('B:C').setNumberFormat('@');   // dates as yyyy-mm-dd text so they group and sort cleanly
  log.setFrozenRows(1);
  log.setColumnWidths(1, HEADER.length, 150);
  log.setColumnWidth(4, 260);

  const daily = ss.insertSheet('Daily Totals');
  daily.getRange('A1').setFormula(
    '=IFERROR(QUERY(Log!A:H, "select B, sum(E) where B is not null group by B pivot D order by B desc label B \'Date\'", 1), "No entries yet")');
  daily.setFrozenRows(1); daily.setFrozenColumns(1);

  const weekly = ss.insertSheet('Weekly Totals');
  weekly.getRange('A1').setFormula(
    '=IFERROR(QUERY(Log!A:H, "select C, sum(E) where C is not null group by C pivot D order by C desc label C \'Week of (Mon)\'", 1), "No entries yet")');
  weekly.setFrozenRows(1); weekly.setFrozenColumns(1);

  const about = ss.insertSheet('About');
  about.getRange(1, 1, 8, 1).setValues([
    ['Bookstore Online Department - Team Tracking'],
    ['Owner: the shared supplies Google account. Backup editors should be added under Share.'],
    ['Log tab: one row per tap from the phone page. qty is how many that tap counted. Do not sort, insert or type in it.'],
    ['Daily Totals and Weekly Totals: formulas over Log, newest first. Weeks start Monday. Do not type in them.'],
    ['To total anything else: File > Download > Microsoft Excel, or make a pivot table from Log on a new tab.'],
    ['Team counts only. No names, order numbers or customer details are stored here.'],
    ['Times are Mountain Time (' + TZ + ').'],
    ['Setup steps and troubleshooting: see orderMetrics/README.md in the toolkit repo.']
  ]);
  about.getRange('A1').setFontWeight('bold').setFontSize(14);
  about.setColumnWidth(1, 900);

  if (starter.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(starter);
  ss.setActiveSheet(daily);
  ss.toast('Setup complete.', 'Team Tracking', 8);
}

/* ============================ WEB ENDPOINT ================================ */

function doGet() {
  return json_({ ok: true, message: 'Team Tracking endpoint is running' });
}

/**
 * POST bodies (sent as text/plain JSON), all need { pin }:
 *   { action: 'check' }                                          is the PIN right?
 *   { action: 'log', device, ops: [ {op:'add', id, key, qty, at} | {op:'undo', id} ] }
 *   { action: 'summary', date: 'yyyy-mm-dd' }                    totals for that day and its week
 */
function doPost(e) {
  try {
    if (PIN === 'CHANGE-ME') return json_({ ok: false, error: 'server not configured' });
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    const pinCheck = checkPin_(body.pin);
    if (pinCheck) return json_({ ok: false, error: pinCheck });

    if (body.action === 'check')   return json_({ ok: true });
    if (body.action === 'summary') return json_(summary_(body.date));
    if (body.action === 'log') {
      const lock = LockService.getScriptLock();
      lock.waitLock(15000);
      try { return json_(log_(body)); } finally { lock.releaseLock(); }
    }
    return json_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function checkPin_(pin) {
  const cache = CacheService.getScriptCache();
  const bad = Number(cache.get('badPins') || 0);
  if (bad >= BAD_PIN_LIMIT) return 'locked';
  if (String(pin || '') === PIN) return null;
  cache.put('badPins', String(bad + 1), 600);
  return 'bad pin';
}

function log_(body) {
  const ops = Array.isArray(body.ops) ? body.ops.slice(0, MAX_OPS) : [];
  const device = String(body.device || '').slice(0, 20);
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Log');

  // Recent ids, so a resent batch doesn't double count.
  const last = sh.getLastRow();
  const look = Math.min(1500, Math.max(0, last - 1));
  const recentIds = look ? sh.getRange(last - look + 1, 7, look, 1).getValues().map(r => String(r[0])) : [];
  const seen = {};
  recentIds.forEach(id => { seen[id] = true; });

  const rows = [];
  const undos = [];
  const rejected = [];
  const now = new Date();
  ops.forEach(o => {
    const id = String(o.id || '').slice(0, 40);
    if (!id) return;
    if (o.op === 'undo') {
      const pendingIdx = rows.findIndex(r => r[6] === id);   // added and undone in the same batch
      if (pendingIdx >= 0) rows.splice(pendingIdx, 1); else undos.push(id);
      return;
    }
    if (o.op !== 'add' || seen[id]) return;
    const label = labelFor_(o.key);
    const qty = Math.floor(Number(o.qty));
    if (!label || !(qty >= 1 && qty <= MAX_QTY)) { rejected.push(id); return; }
    let at = new Date(o.at);
    // Trust the phone's tap time unless it is in the future or more than 2 days old.
    if (isNaN(at.getTime()) || at > now || now - at > 2 * 864e5) at = now;
    rows.push([at, ymd_(at), ymd_(mondayOf_(at)), label, qty, String(o.key), id, device]);
    seen[id] = true;
  });

  if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, HEADER.length).setValues(rows);

  let undone = 0;
  if (undos.length) {
    const end = sh.getLastRow();
    const n = Math.min(3000, Math.max(0, end - 1));
    if (n) {
      const ids = sh.getRange(end - n + 1, 7, n, 1).getValues();
      const want = {};
      undos.forEach(id => { want[id] = true; });
      for (let i = ids.length - 1; i >= 0; i--) {          // bottom up so row numbers stay valid
        if (want[String(ids[i][0])]) { sh.deleteRow(end - n + 1 + i); undone++; }
      }
    }
  }
  return { ok: true, added: rows.length, undone: undone, rejected: rejected };
}

function summary_(dateStr) {
  const today = ymd_(new Date());
  const day = /^\d{4}-\d{2}-\d{2}$/.test(String(dateStr || '')) ? String(dateStr) : today;
  const p = day.split('-').map(Number);
  const monday = ymd_(mondayOf_(new Date(Date.UTC(p[0], p[1] - 1, p[2], 18))));   // 18:00 UTC = midday Mountain

  const out = { ok: true, date: day, today: today, weekOf: monday, day: {}, week: {}, byDay: {}, byHour: {},
                updatedAt: new Date().toISOString() };
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Log');
  const last = sh.getLastRow();

  // Log is in time order, so read backward in blocks until we pass the start of the week.
  const BLOCK = 2000;
  let end = last;
  while (end >= 2) {
    const start = Math.max(2, end - BLOCK + 1);
    const vals = sh.getRange(start, 1, end - start + 1, 6).getValues();
    let passed = false;
    for (let i = vals.length - 1; i >= 0; i--) {
      const d = String(vals[i][1]);
      if (d < monday) { passed = true; continue; }          // keep scanning this block: late batches can be out of order
      if (d > day) continue;
      const key = String(vals[i][5]);
      const qty = Number(vals[i][4]) || 0;
      out.week[key] = (out.week[key] || 0) + qty;
      out.byDay[d] = out.byDay[d] || {};
      out.byDay[d][key] = (out.byDay[d][key] || 0) + qty;
      if (d === day) {
        out.day[key] = (out.day[key] || 0) + qty;
        const ts = vals[i][0];
        if (ts instanceof Date) {
          const h = Utilities.formatDate(ts, TZ, 'H');
          out.byHour[h] = (out.byHour[h] || 0) + qty;
        }
      }
    }
    if (passed) break;
    end = start - 1;
  }
  return out;
}

/* ============================ HELPERS ===================================== */

function ymd_(d) { return Utilities.formatDate(d, TZ, 'yyyy-MM-dd'); }

/** Monday (Mountain Time) of the week containing d, as a Date at local noon. */
function mondayOf_(d) {
  const s = ymd_(d).split('-').map(Number);
  const local = new Date(Date.UTC(s[0], s[1] - 1, s[2], 12));
  const dow = (local.getUTCDay() + 6) % 7;                 // Monday = 0
  local.setUTCDate(local.getUTCDate() - dow);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), 18)); // noon MT
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
