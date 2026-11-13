# Pickup Reminders (Pickup Shelf Scan)

How the pickup reminder tool works and how to set it up. Built the same way as the Supply Tracker.

**What it does:** someone scans every bag on the pickup shelves with the Wasp scanner paired to a
phone and submits the scan. On the shared PC, the Pickup Reminders page turns that scan into the
PL ID list for Arc, reads the xlsx Arc gives back, and sorts every bag:

| Bucket | Rule | What to do |
|---|---|---|
| Needs reminder | 14+ days since packed, not yet restock, no pink sticker | Write reminder → send → pink sticker on bag → Mark sent |
| Restock | 21+ days since packed (28+ for bags packed before 11/13/2026) | Print the list, pull the bags |
| Reminder already sent | Same window, has a pink sticker | Nothing |
| Waiting | Under 14 days | Nothing |

Reminders go by **PL ID** (one per bag), using that bag's pack date.

**Where things live**
| Piece | Where |
|---|---|
| The latest scan (PL IDs and sticker flags only) | Google Sheet "Pickup Shelf Scan" on the shared account |
| Phone page `scan.html` and PC page `index.html` + `app.js` | `pickupShelfScan/` in this repo |
| The brains (save, undo, sticker flag) | Apps Script, opened from the sheet: Extensions > Apps Script (`Code.gs` here is the copy) |

The sheet tabs: **Current** (latest scan), **Previous** (the scan before it, for undo), **About**.
Every submit replaces Current, so the sheet never grows. Customer names and emails come from the Arc
file and are only ever on the PC; they never go into the sheet.

---

## Daily use

**On the phone (`scan.html`)**
1. Type your name once (the phone remembers it).
2. Tap the big box so it says "Ready", then scan **every** bag on the pickup shelves.
3. Bag has a pink sticker? Tap **Next bag has a pink sticker**, then scan it. The toggle turns itself off
   after one scan. Forgot? Tap the bag's tag in the list to flip it.
4. Tap **Finish & submit**. If the count is a lot lower than last time it will warn you. Missed a shelf? Go back and keep scanning.

Lost your place? Rescanning a bag does nothing (it beeps "already scanned"). Anything that isn't a 7-digit
PL ID is rejected, so scanning an ISBN by mistake is harmless. Scans are kept on the phone until you
submit, even if the page reloads.

**On the PC (`index.html`)**
1. **Load latest scan** → **Copy for Arc** → paste into Arc and download the xlsx.
2. Drop the xlsx onto the page.
3. For each bag under **Needs reminder**: **Write reminder** opens the Customer Email Builder with the
   Pickup reminder template, name, order number and pack date filled in. Send the email, add the Insite
   note, put the pink sticker on the bag, then **Mark sent**.
4. **Print restock list** and pull those bags.

Submitted a bad scan? **Undo last submit** on the PC page puts the previous scan back.

---

## One-time setup (about 15 minutes)

1. On the shared Google account, create a new Google Sheet named **Pickup Shelf Scan**.
2. Extensions > Apps Script. Delete what is there and paste in all of `Code.gs`.
3. Change `SHARED_KEY` at the top to a new long random string (don't reuse the supply tracker's).
4. Pick `setup` in the function dropdown, click Run, and approve the permissions. The tabs appear.
5. Deploy > New deployment > type **Web app**. Execute as: **Me**. Who has access: **Anyone**. Deploy and copy the URL ending in `/exec`.
6. Paste the URL and key into the two lines at the top of **both** `scan.html` and `app.js`. Commit.
7. Test: open `scan.html` on the phone, pair the Wasp scanner, scan two packing slips, submit.
   On the PC, click Load latest scan and check the two PL IDs appear.

**Changing the script later:** Deploy > Manage deployments > edit (pencil) > Version: New version > Deploy.
That keeps the same URL. "New deployment" makes a new URL, and the pages would need updating.

---

## Things to know

- **The key is not secret.** It sits in public files on GitHub Pages, same as the supply tracker. It
  stops random traffic, not a determined person. That's fine here because the sheet only holds PL IDs.
- **Mark sent is saved twice:** in the sheet (so it shows as stickered right away) and in this PC's
  browser, in case the sheet can't be reached. The next shelf scan picks up the physical sticker anyway.
- **Pack dates** are read as calendar days. Arc sends them as `2026-10-12` text; `10/12/2026` and real
  Excel dates also work. The "Count days as of" box changes "today" if you need to check a different day.
- **Rules live at the top of `app.js`:** `REMIND_DAYS = 14`, `RESTOCK_DAYS = 21`, and the Arc separator `', '`. Bags packed before `NEW_POLICY_START` (2026-11-13) were promised 28 days (`OLD_RESTOCK_DAYS`) and keep it; delete that grandfathering once those bags are gone.
  The day ranges printed on the page follow those two numbers.
  The PL ID length (7) is at the top of `scan.html`.
- **Email builder link:** `customerEmailBuilder/index.html?template=pickupReminder&name=...&order=...&packed=YYYY-MM-DD`
  fills those fields. A plain visit to the builder is unchanged.
