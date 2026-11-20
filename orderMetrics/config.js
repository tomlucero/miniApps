/* Team Tracking - shared settings for log.html and index.html (the dashboard). */

// ---- EDIT THESE TWO LINES --------------------------------------------------------
// The Apps Script web app URL (ends in /exec). The PIN does NOT go here: it lives only in the Apps Script.
const TT_ENDPOINT = 'https://script.google.com/macros/s/AKfycby_L1Ldz_drskaRvdF5_KszPFOldZcq23mDo8Kni6krO79Zg-EIMlG-TGnN7ksJhOas/exec';
// Optional: the Google Sheet's address, so the dashboard shows an "Open sheet" button. Leave '' to hide it.
const TT_SHEET_URL = '';
// ---------------------------------------------------------------------------------

// What the buttons count. Keep the keys in sync with ITEMS / CHANNELS / SUBJECTS in Code.gs.
// Changing a label is safe any time. Changing a key starts a new column in the sheet.
// total: true adds a "Total" tile for that group on the dashboard. note: a hint shown under the buttons.
const TT_GROUPS = [
  { title: 'Shipping', icon: 'fa-truck-fast', total: true, note: 'Mixed order? Count it as Course Materials.', items: [
    { key: 'ship_cm',    label: 'Course Materials', long: 'Shipping · Course Materials', icon: 'fa-book' },
    { key: 'ship_merch', label: 'Merchandise',      long: 'Shipping · Merchandise',      icon: 'fa-shirt' }
  ]},
  { title: 'Pick up at store', icon: 'fa-store', total: true, note: 'Mixed order? Count it as Course Materials.', items: [
    { key: 'pickup_cm',    label: 'Course Materials', long: 'Pick up at store · Course Materials', icon: 'fa-book' },
    { key: 'pickup_merch', label: 'Merchandise',      long: 'Pick up at store · Merchandise',      icon: 'fa-shirt' }
  ]},
  { title: 'Requests', icon: 'fa-inbox', items: [
    { key: 'cancel',  label: 'Cancellation request', long: 'Cancellation requests' },
    { key: 'pending', label: 'Pending order',        long: 'Pending orders' }
  ]}
];
const TT_CHANNELS = [
  { key: 'call',      label: 'Phone call', icon: 'fa-phone' },
  { key: 'voicemail', label: 'Voicemail',  icon: 'fa-voicemail' },
  { key: 'email',     label: 'Email',      icon: 'fa-envelope' }
];
const TT_SUBJECTS = [
  { key: 'order_status', label: 'Order status' },
  { key: 'textbook',     label: 'Textbook question' },
  { key: 'merch',        label: 'Merch question' },
  { key: 'general',      label: 'General question' },
  { key: 'returns',      label: 'Returns' },
  { key: 'other',        label: 'Other' }
];

/* ---------- helpers shared by both pages ---------- */
const TT_PIN_KEY = 'teamTracking.pin';

function ttLabel(key) {
  for (const g of TT_GROUPS) for (const i of g.items) if (i.key === key) return i.long;
  const [c, s] = String(key).split('.');
  const ch = TT_CHANNELS.find(x => x.key === c), su = TT_SUBJECTS.find(x => x.key === s);
  return ch && su ? ch.label + ' · ' + su.label : key;
}
function ttConfigured() { return /^https:\/\/script\.google\.com\/.+\/exec$/.test(TT_ENDPOINT); }
function ttGetPin() { try { return localStorage.getItem(TT_PIN_KEY) || ''; } catch (e) { return ''; } }
function ttSetPin(p) { try { p ? localStorage.setItem(TT_PIN_KEY, p) : localStorage.removeItem(TT_PIN_KEY); } catch (e) {} }

/** POST to the Apps Script. Resolves to the JSON reply; rejects on network trouble. */
async function ttPost(body, opts) {
  const res = await fetch(TT_ENDPOINT, Object.assign({
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },   // text/plain avoids a CORS preflight
    body: JSON.stringify(Object.assign({ pin: ttGetPin() }, body))
  }, opts || {}));
  return res.json();
}

/**
 * Shows the PIN screen (an element with id="pinGate" containing #pinForm, #pinInput, #pinMsg)
 * until the server accepts a PIN, then calls onReady(). Remembers the PIN on this device.
 */
function ttPinGate(onReady) {
  const gate = document.getElementById('pinGate');
  const form = document.getElementById('pinForm');
  const input = document.getElementById('pinInput');
  const msg = document.getElementById('pinMsg');
  const show = (text) => { gate.hidden = false; msg.textContent = text || ''; setTimeout(() => input.focus(), 50); };
  const hide = () => { gate.hidden = true; onReady(); };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pin = input.value.trim();
    if (!pin) return;
    msg.textContent = 'Checking…';
    ttSetPin(pin);
    try {
      const d = await ttPost({ action: 'check' });
      if (d.ok) { input.value = ''; hide(); return; }
      ttSetPin('');
      msg.textContent = d.error === 'locked' ? 'Too many wrong tries. Wait 10 minutes and try again.'
                      : d.error === 'bad pin' ? 'That PIN is not right.'
                      : 'The server said: ' + d.error;
    } catch (err) {
      ttSetPin('');
      msg.textContent = 'Could not reach the server. Check the connection and try again.';
    }
  });

  if (!ttConfigured()) { show('This tool has not been set up yet (no endpoint in config.js).'); form.querySelector('button').disabled = true; return { show }; }
  if (ttGetPin()) hide(); else show();
  return { show: (t) => { ttSetPin(''); show(t); } };
}
