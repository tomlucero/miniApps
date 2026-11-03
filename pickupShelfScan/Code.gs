/**
 * Bookstore Online Department - Pickup Shelf Scan (v1)
 * Lives in its own Google Sheet ("Pickup Shelf Scan") on the shared account.
 *
 * ORDER OF OPERATIONS (details in README.md):
 *   1. Edit SHARED_KEY below (any long random string; the same value goes in scan.html and app.js).
 *   2. Run setup()                -> builds the Current, Previous and About tabs
 *   3. Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone)
 *   4. Paste the /exec URL into scan.html and app.js.
 *
 * HOW IT WORKS
 *   - The phone page scans every bag on the pickup shelf, then submits the whole list at once.
 *   - A submit REPLACES the Current tab. The scan it replaced moves to Previous (one backup, nothing older).
 *   - "Undo last submit" swaps Current and Previous back.
 *   - "stickered" = the bag already has a pink reminder sticker. The PC page can also set it
 *     when someone marks a reminder as sent, so it drops off the reminder list right away.
 *   - Only PL IDs are stored here. Names and emails stay in the Arc file on the PC.
 */

// ---- EDIT THIS --------------------------------------------------------------
const SHARED_KEY = 'CHANGE-ME';   // must match SHARED_KEY in scan.html and app.js
// -----------------------------------------------------------------------------

const MAX_BAGS = 2000;             // safety limit per scan
const PLID_PATTERN = /^\d{4,12}$/; // loose server check; the phone page enforces the exact length
const HEADER = ['pl_id', 'stickered', 'scanned_at', 'submitted_at', 'submitted_by'];

/* ============================ ONE-TIME SETUP ============================== */

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss.getSheetByName('Current') || ss.getSheetByName('Previous')) {
    throw new Error('Setup has already been run (a Current or Previous tab exists). ' +
                    'Delete those tabs first if you really want to start over.');
  }
  const starter = ss.getSheets()[0];

  ['Current', 'Previous'].forEach(name => {
    const sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, HEADER.length).setValues([HEADER]).setFontWeight('bold');
    sh.getRange('A:A').setNumberFormat('@');                       // keep PL IDs as text
    sh.getRange('C:D').setNumberFormat('yyyy-mm-dd hh:mm:ss');
    sh.setFrozenRows(1);
    sh.setColumnWidths(1, HEADER.length, 150);
  });

  const about = ss.insertSheet('About');
  about.getRange(1, 1, 7, 1).setValues([
    ['Bookstore Online Department - Pickup Shelf Scan'],
    ['Owner: the shared Google account. Backup editors should be added under Share.'],
    ['Current tab: the latest full shelf scan. It is replaced every time someone submits a scan. Do not type in it.'],
    ['Previous tab: the scan before that, kept only so "Undo last submit" works. Nothing older is kept.'],
    ['stickered = yes means the bag already has a pink reminder sticker (reminder already sent).'],
    ['Only PL IDs live here. Customer names and emails come from the Arc file and never touch this sheet.'],
    ['Setup steps and troubleshooting: see pickupShelfScan/README.md in the toolkit repo.']
  ]);
  about.getRange('A1').setFontWeight('bold').setFontSize(14);
  about.setColumnWidth(1, 900);

  if (starter.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(starter);
  ss.setActiveSheet(ss.getSheetByName('Current'));
  ss.toast('Setup complete.', 'Pickup Shelf Scan', 8);
}

/* ============================ WEB ENDPOINT ================================ */

/** GET ?action=latest returns the current scan (and the previous scan's size for comparison). */
function doGet(e) {
  const action = e && e.parameter && e.parameter.action;
  if (action === 'latest') {
    const cur = readScan_('Current');
    const prev = readScan_('Previous');
    return json_({ ok: true, current: cur, previousCount: prev.bags.length, previousSubmittedAt: prev.submittedAt });
  }
  return json_({ ok: true, message: 'Pickup shelf scan endpoint is running' });
}

/**
 * POST bodies (sent as text/plain JSON):
 *   { key, action: 'submit',  by, bags: [{ id, stickered, at }] }   replace Current, old Current -> Previous
 *   { key, action: 'undo' }                                          swap Current and Previous
 *   { key, action: 'sticker', id, stickered: true|false }            flip one bag in Current
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    if (SHARED_KEY === 'CHANGE-ME') return json_({ ok: false, error: 'server not configured' });

    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.key !== SHARED_KEY) return json_({ ok: false, error: 'bad key' });

    if (body.action === 'submit')  return json_(submit_(body));
    if (body.action === 'undo')    return json_(undo_());
    if (body.action === 'sticker') return json_(sticker_(body));
    return json_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function submit_(body) {
  const bags = Array.isArray(body.bags) ? body.bags : [];
  if (bags.length < 1 || bags.length > MAX_BAGS) return { ok: false, error: 'bad bag count' };

  const now = new Date();
  const by = String(body.by || '').slice(0, 40);
  const seen = {};
  const rows = [];
  for (let i = 0; i < bags.length; i++) {
    const id = String(bags[i].id || '').trim();
    if (!PLID_PATTERN.test(id)) return { ok: false, error: 'bad PL ID: ' + id.slice(0, 20) };
    if (seen[id]) continue;                     // duplicates are ignored, not an error
    seen[id] = true;
    const at = new Date(bags[i].at);
    rows.push([id, bags[i].stickered ? 'yes' : 'no', isNaN(at.getTime()) ? now : at, now, by]);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const cur = ss.getSheetByName('Current');
  const prev = ss.getSheetByName('Previous');

  // Current -> Previous, then write the new scan into Current.
  copyBody_(cur, prev);
  clearBody_(cur);
  cur.getRange(2, 1, rows.length, HEADER.length).setValues(rows);

  return { ok: true, count: rows.length, submittedAt: now.toISOString() };
}

function undo_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const cur = ss.getSheetByName('Current');
  const prev = ss.getSheetByName('Previous');
  if (prev.getLastRow() < 2) return { ok: false, error: 'nothing to undo (Previous is empty)' };

  const curVals = bodyValues_(cur);
  const prevVals = bodyValues_(prev);
  clearBody_(cur);
  clearBody_(prev);
  if (prevVals.length) cur.getRange(2, 1, prevVals.length, HEADER.length).setValues(prevVals);
  if (curVals.length) prev.getRange(2, 1, curVals.length, HEADER.length).setValues(curVals);
  return { ok: true, count: prevVals.length };
}

function sticker_(body) {
  const id = String(body.id || '').trim();
  if (!PLID_PATTERN.test(id)) return { ok: false, error: 'bad PL ID' };
  const cur = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Current');
  const last = cur.getLastRow();
  if (last < 2) return { ok: false, error: 'no current scan' };
  const ids = cur.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === id) {
      cur.getRange(i + 2, 2).setValue(body.stickered ? 'yes' : 'no');
      return { ok: true, id: id, stickered: !!body.stickered };
    }
  }
  return { ok: false, error: 'PL ID ' + id + ' is not in the current scan' };
}

/* ============================ HELPERS ===================================== */

function readScan_(name) {
  const vals = bodyValues_(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name));
  const iso = d => (d instanceof Date) ? d.toISOString() : null;
  return {
    submittedAt: vals.length ? iso(vals[0][3]) : null,
    submittedBy: vals.length ? String(vals[0][4]) : '',
    bags: vals.map(r => ({ id: String(r[0]), stickered: r[1] === 'yes', at: iso(r[2]) }))
  };
}

function bodyValues_(sh) {
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, HEADER.length).getValues().filter(r => r[0] !== '');
}

function clearBody_(sh) {
  const last = sh.getLastRow();
  if (last >= 2) sh.getRange(2, 1, last - 1, HEADER.length).clearContent();
}

function copyBody_(from, to) {
  const vals = bodyValues_(from);
  clearBody_(to);
  if (vals.length) to.getRange(2, 1, vals.length, HEADER.length).setValues(vals);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
