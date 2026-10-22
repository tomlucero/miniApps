# Supply Manager README

How the Online Department supply tracker works and how to change it. No coding needed for
everything in the first two sections.

**What it does:** every time someone takes a box or mailer, they scan its shelf label with the
work phone and tap Confirm. The Google Sheet keeps count and emails the shared mailbox when
something gets low.

**Where things live**
| Piece | Where |
|---|---|
| The data (counts, items, history) | Google Sheet "Bookstore Supply Tracker" on the shared supply account |
| The scan page (`log.html`) and the manager page (`manage.html`) | The toolkit's GitHub repo |
| The brains (alerts, saving scans) | Apps Script, opened from the sheet: Extensions > Apps Script |

The sheet's tabs: **Stock** (calculated, don't type here), **Items** (the list of supplies),
**Log** (every scan, delivery and count, never edit), **About**.

---

## Add a new item (about 10 minutes, no code)

Example: adding a 10x13 poly mailer.

**1. Add a row in the Items tab.** Go to the first empty row at the bottom and fill in:

| Column | What to put | Example |
|---|---|---|
| id | Short code for the QR label. Lowercase, no spaces, letters/numbers/hyphens/periods only. Must be unique. | `poly-10x13` |
| name | What people see on the phone and in emails | `10x13 Poly Mailer` |
| category | Anything: Box, Mailer, Tube... | `Mailer` |
| pack_size | Units per bundle or case. Leave blank if it comes loose. | `100` |
| alert_at | Alert when on-hand reaches this number. Blank means 10. | `20` |
| active | `yes` | `yes` |
| alerted | **Leave blank.** The script uses it. | |

**2. Log a starting count right away.** Open `manage.html` > **Shelf count**, type how many
are on the shelf for the new item, leave everything else blank, Save.
Do this the same day: until it has a count, the new item looks like 0 and will trigger a low-stock email.

**3. Make a shelf label.** The QR code should open:
`https://tomlucero.github.io/miniApps/log.html?i=poly-10x13`
(the part after `?i=` must be exactly the id from the sheet). Copy an existing Dymo label,
swap in the new QR code and name, and print.

**4. Test it.** Scan the new label with the Moto, tap Confirm, and check that a row appears in
the Log tab and the Stock tab shows one fewer. If you scanned by mistake, use **Undo a scan** in `manage.html`.

That's all. The scan page and manager page pick up new items on their own.

### Rules that keep the sheet from breaking
- **Add new items in the next empty row.** Don't insert rows in the middle of Items, sort it, or
  delete rows. The Stock tab is wired to the Items rows, and moving them shifts everything.
- **Never change an item's id after its labels are printed.** The old labels would stop working and
  its history would be orphaned. You can change the name, category, pack size and alert level any time.
- **The Stock tab handles 60 items.** Past that, ask for the formulas to be extended.

---

## Everyday changes

| I want to... | Do this |
|---|---|
| Change when an item alerts | Items tab, edit `alert_at` for that item |
| Rename an item | Items tab, edit `name` |
| Stop tracking an item | Items tab, set `active` to `no`. History stays in the Log |
| Bring it back | Set `active` back to `yes`, then do a Shelf count for it |
| Log a delivery | `manage.html` > Delivery (enter packs, it converts to units) |
| Fix a wrong scan | `manage.html` > Undo a scan |
| Correct drifting numbers | `manage.html` > Shelf count, type what is really on the shelf |
| See what we use most | Stock tab: Used (7d), Used (30d), Avg/day |
| Change who gets alert emails | Apps Script, top of the code: `ALERT_EMAIL` (then deploy a new version, see below) |

**Rule for the Log tab:** never edit or delete rows. The history is the whole point. Fix mistakes
with Undo or a new shelf count.

---

## Changing the code (the vibe-coding part)

If you want something new, such as lids counted automatically with tubes, a different alert time,
a weekly summary email, or a new button on a page, you can describe it to an AI assistant and
paste its result in. A safe routine:

1. **Save a copy first.** In the sheet: File > Make a copy. In Apps Script, version history also lets you go back.
2. **Give the AI the real file.** Paste the whole current `Code.gs` (or the HTML page) and say what you want. Say "change only what is needed."
3. **Ask it to explain what it changed** and what could go wrong, in plain words.
4. **Paste the new code in and Save.**
5. **For `Code.gs` changes, publish them.** Deploy > Manage deployments > pencil icon > Version: **New version** > Deploy.
   If you skip this, the live page keeps running the old code. The URL stays the same.
6. **Test with one real scan, then check the Log and Stock tabs.** For page changes (`log.html`, `manage.html`), push the file to GitHub and reload.
7. If it breaks, put the old code back and redeploy.

Things worth knowing before changing code:
- The **key** (`SHARED_KEY`) and the **web app URL** must match between `Code.gs` and the two pages.
- The Stock tab formulas are created by the `setup` function. Don't run `setup` again on a working sheet. It refuses, on purpose.
- Test changes on a copy of the sheet with its own deployment, not the live one.

---

## If something looks wrong

| Symptom | Likely cause |
|---|---|
| Scan page says "not recognized" | The id in the QR code doesn't match the id in the Items tab |
| "bad key" | The key in the page doesn't match `SHARED_KEY` in the code |
| Page can't reach the server | No signal, or the deployment isn't set to "Anyone". Check the Log before retrying, it may have saved |
| Stock shows `#REF!` | A row was deleted or moved in Items. Undo (Ctrl+Z), or restore from version history |
| Counts are drifting from the shelf | Scans were missed. Do a Shelf count. If it happens a lot, that's useful to know |
| No alert emails | Check Junk, then Apps Script > Triggers (clock icon) should show `dailyCheck`. If not, run `installDailyTrigger` |
| An item is low but no email | It already alerted once. It re-arms after it's restocked above its alert level |
| Alerts stopped entirely | The shared account may need to sign in and re-approve permissions, or the account was locked. Check its email |

**The shared account owns everything.** Keep its recovery details with Tom, keep a few people as
editors on the sheet under Share, and sign in once every few months so Google doesn't treat it
as inactive.
