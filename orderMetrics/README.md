# Team Tracking (orderMetrics)

How the team tally tool works and how to set it up. Built the same way as the Supply Tracker and Pickup Reminders.

**What it does:** student staff tap a big button on the department phone (or any computer) every time
an order comes in (Shipping or Pick up at store, each split into Course Materials and Merchandise),
a cancellation request, a pending order, or a phone call / voicemail / email. Each tap becomes one row in a Google Sheet. The dashboard
shows today's totals and the week to date (the week restarts every Monday).

Team counts only. No names, order numbers or customer details are stored.

**Where things live**
| Piece | Where |
|---|---|
| The data | Google Sheet **Team Tracking** on `csubookstore.online.supplies@gmail.com` |
| Tally page `log.html` (phone) and dashboard `index.html` (PC) | `orderMetrics/` in this repo |
| Settings shared by both pages (endpoint URL, button list) | `orderMetrics/config.js` |
| The brains (saving taps, undo, totals, PIN check) | Apps Script, opened from the sheet: Extensions > Apps Script (`Code.gs` here is the copy) |

Sheet tabs: **Log** (one row per tap, don't edit), **Daily Totals** and **Weekly Totals** (formulas, newest first), **About**.

---

## Daily use

**Tally page** (`https://tomlucero.github.io/miniApps/orderMetrics/log.html`)
1. Enter the team PIN once. The device remembers it.
2. Tap the button for what just happened. One tap = 1.
   An order with both course materials and merch counts as **Course Materials**, since that's what brought them in.
3. **Doing a stack?** Tap **5**, **10**, **25**, or **#** (type any number up to 500) first, then the button.
   The number only applies to that one tap, then it goes back to 1.
4. **Phone call / Voicemail / Email:** tap the channel, then tap what it was about.
5. **Tapped the wrong thing?** **Undo last entry** at the bottom. Tap it again to undo the one before.

The badge at the top right says **✓ All saved** when the sheet has everything. Taps are kept on the
device first, so a slow or dropped connection never loses one: it shows "Offline · 3 waiting" and sends
them when the connection comes back, even after the page is closed and reopened.

Tip: on the department phone, open the tally page and use "Add to Home screen" so it opens like an app.

**Dashboard** (`https://tomlucero.github.io/miniApps/orderMetrics/index.html`)
- Shows **Today** and **Week to date** for Shipping and Pick up at store (Course Materials, Merchandise
  and a total for each), Requests (cancellations, pending orders) and Customer contacts, plus a day-by-day table for the week,
  contacts by subject, and activity by hour.
- Refreshes itself every 2 minutes while it shows today.
- Pick a date to see that day and its week (Monday through that day).

**Totaling anything else:** open the sheet. **Daily Totals** and **Weekly Totals** already have one
column per item. For Excel: File > Download > Microsoft Excel (.xlsx). For your own pivot, make a new
tab and point a pivot table at **Log**.

---

## One-time setup (about 15 minutes)

1. Sign in to Google as `csubookstore.online.supplies@gmail.com` and create a new Google Sheet named **Team Tracking**.
2. Extensions > Apps Script. Delete what is there and paste in all of `Code.gs`.
3. **In the Apps Script editor only**, change `const PIN = 'CHANGE-ME';` to the team PIN (digits, 4 or more).
   Don't put the real PIN in the GitHub copy of `Code.gs`: the repo is public.
4. Pick `setup` in the function dropdown, click Run, and approve the permissions. The tabs appear.
5. Deploy > New deployment > type **Web app**. Execute as: **Me**. Who has access: **Anyone**. Deploy and copy the URL ending in `/exec`.
6. In `orderMetrics/config.js`, paste that URL into `TT_ENDPOINT`. Optionally paste the sheet's address into
   `TT_SHEET_URL` to get an "Open sheet" button on the dashboard. Commit.
7. Test: open the tally page on the phone, enter the PIN, tap **Shipped** twice and **Undo** once.
   Check that one row is in **Log** and the dashboard shows 1 shipped today.

**Changing the script later:** Deploy > Manage deployments > edit (pencil) > Version: New version > Deploy.
That keeps the same URL. "New deployment" makes a new URL, and `config.js` would need updating.

**Changing the PIN:** edit `PIN` in the Apps Script editor, then redeploy as above (new version).
Every device will ask for the new PIN on its next tap; taps made in the meantime wait on the device.

---

## Adding or renaming a button

Buttons are listed in two places that must match:
- `config.js`: `TT_GROUPS` (order and request buttons), `TT_CHANNELS`, `TT_SUBJECTS`. This controls what the pages show.
- `Code.gs`: `ITEMS`, `CHANNELS`, `SUBJECTS`. This is what the sheet accepts and the column names it writes.

Rules:
- **Removing a button:** take it out of both files. Rows already in the Log keep their old name, but the dashboard stops showing them.
- **Renaming a label** is safe any time. Old rows keep the old name in the Log, so the totals tabs would show two columns for a while.
- **Never change a key** (the short `snake_case` id). The dashboard counts by key.
- **Adding a button:** add it to both files with a new key, then redeploy the script (new version).

---

## Things to know

- **The PIN keeps out people who stumble onto the page.** It lives only in the Apps Script, never in a page,
  and after 15 wrong tries in 10 minutes the sheet locks everyone out for 10 minutes. It is not strong security,
  which is fine here because the sheet only holds counts.
- **Times are Mountain Time.** Each row keeps the time it was tapped on the device, so taps sent late still land on the right day and hour.
- **No double counting:** every tap has an id, and the sheet ignores an id it has already saved.
- **Undo** only reaches taps made on that same device today.
- **Size:** each tap is one row. Even a very busy rush (a few thousand taps a day) is far below Google Sheets'
  limits for years. The dashboard only reads the current week, so it stays fast.
