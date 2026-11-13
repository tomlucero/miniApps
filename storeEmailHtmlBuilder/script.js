/*
 * Store Email HTML Builder
 *
 * Every email uses ONE structure, modeled on the Order Confirmation email:
 * green header (logo, optional eyebrow, headline, subhead), cream card
 * (title, opening, boxes, sections, details, items, totals), green footer.
 *
 * Templates below only supply WORDING (the editable fields) and pick which
 * building blocks to use. Do not add styling inside a template; change the
 * building blocks instead so every email stays the same.
 *
 * Email-client notes:
 * - Tables and inline styles only, so Gmail, Outlook and Apple Mail match.
 * - Outlook for Windows ignores max-width, so the 600px column is wrapped in
 *   an Outlook-only fixed-width table.
 * - Spacing uses table-cell padding; the font is set on every text element.
 * - <<<TOKENS>>> are filled in by the CMS and are never HTML-escaped.
 *
 * Field formatting (shown to staff on the page):
 *   **bold**, lines starting with "- " become bullets, [text](https://url)
 *   makes a link, and email addresses / https:// links are linked
 *   automatically. A blank line starts a new paragraph. Empty fields are
 *   left out of the email.
 */

const BRAND = {
  logoUrl: "https://www.bookstore.colostate.edu/SiteImages/109-SchoolImages/109-EmailImages/109-Bookstore-WhHoPNGTran200x60@2x.png",
  green: "#1e4d2b",
  darkGreen: "#163c21",
  gold: "#c8c372",
  cream: "#fcfbf7",
  page: "#e6ebe6",
  ink: "#1d2722",
  text: "#2f3a34",
  muted: "#5a655f",
  label: "#617068",
  line: "#d9dfd7",
  discount: "#b14f07"
};

const FONT = "font-family:Arial, Helvetica, sans-serif;";

// Footer mailing address and phone numbers, shared by every email.
const FOOTER_ADDRESS = "CSU Bookstore<br>8035 Campus Delivery<br>Fort Collins, CO 80523<br>Store: (970) 491-0546 &bull; Course Materials Information: (970) 491-5461";

// Box colors. Every box in every email uses one of these.
const TONES = {
  info: { accent: BRAND.green, background: "#f1f5f1", border: "#d9dfd7", title: BRAND.darkGreen, width: 4 },
  note: { accent: BRAND.gold, background: "#faf7e8", border: "#e4ddb1", title: BRAND.darkGreen, width: 6 },
  alert: { accent: "#d9782d", background: "#fff4e8", border: "#efc6a1", title: "#8c4b14", width: 6 }
};

/* ---------- Text helpers ---------- */

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Escape typed text but keep CMS tokens such as <<<ORDERNUM>>> intact.
function safeText(value = "") {
  return escapeHtml(value).replace(/&lt;&lt;&lt;([A-Za-z0-9_-]+)&gt;&gt;&gt;/g, "<<<$1>>>");
}

function link(href, text) {
  return `<a href="${href}" style="color:${BRAND.green}; text-decoration:underline;">${text}</a>`;
}

// One line of field text: escape, then links and **bold**.
function inline(value) {
  const saved = [];
  const keep = (html) => `\u0000${saved.push(html) - 1}\u0000`;
  let out = safeText(value);
  out = out.replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)/g, (m, text, href) => keep(link(href, text)));
  out = out.replace(/https?:\/\/[^\s<\u0000]*[^\s<\u0000.,;:!?)]/g, (url) => keep(link(url, url)));
  out = out.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, (email) => keep(link(`mailto:${email}`, email)));
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  return out.replace(/\u0000(\d+)\u0000/g, (m, i) => saved[Number(i)]);
}

// Multi-line field text: paragraphs (blank line) and "- " bullet lists.
function rich(value = "", size = 16, color = BRAND.text) {
  const lineHeight = Math.round(size * 1.5);
  const textStyle = `${FONT} font-size:${size}px; line-height:${lineHeight}px; color:${color};`;
  const groups = [];
  String(value).replace(/\r/g, "").split("\n").forEach((raw) => {
    const line = raw.trim();
    const last = groups[groups.length - 1];
    if (!line) { groups.push({ type: "break" }); return; }
    const isBullet = /^- /.test(line);
    const type = isBullet ? "list" : "para";
    const text = isBullet ? line.slice(2) : line;
    if (last && last.type === type) last.lines.push(text);
    else groups.push({ type, lines: [text] });
  });
  const blocks = groups.filter((g) => g.type !== "break");
  return blocks.map((g, index) => {
    const bottom = index === blocks.length - 1 ? 0 : 12;
    if (g.type === "list") {
      const items = g.lines.map((l, i) => `<li style="margin:0 0 ${i === g.lines.length - 1 ? 0 : 8}px 0; ${textStyle}">${inline(l)}</li>`).join("");
      return `<ul style="margin:0 0 ${bottom}px 0; padding:0 0 0 22px;">${items}</ul>`;
    }
    return `<p style="margin:0 0 ${bottom}px 0; ${textStyle}">${g.lines.map(inline).join("<br>")}</p>`;
  }).join("\n");
}

function has(value) {
  return String(value || "").trim().length > 0;
}

/* ---------- Building blocks (the only place email styling lives) ---------- */

// One full-width row of the card, with top spacing.
function block(inner, paddingTop = 24) {
  return `
              <tr>
                <td style="padding:${paddingTop}px 0 0 0;">
${inner}
                </td>
              </tr>`;
}

function divider() {
  return `
              <tr>
                <td style="padding:22px 0 0 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                    <tr><td height="1" style="height:1px; font-size:1px; line-height:1px; background-color:${BRAND.line};" bgcolor="${BRAND.line}">&nbsp;</td></tr>
                  </table>
                </td>
              </tr>`;
}

function spacedTable(inner, paddingTop) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td style="padding:${paddingTop}px 0 0 0;">${inner}</td></tr></table>`;
}

function sectionTitle(text) {
  return `<h3 style="margin:0; ${FONT} font-size:20px; line-height:26px; color:${BRAND.darkGreen}; font-weight:bold; mso-line-height-rule:exactly;">${inline(text)}</h3>`;
}

function smallLabel(text, color = BRAND.label) {
  return `<p style="margin:0 0 6px 0; ${FONT} font-size:12px; line-height:18px; letter-spacing:.6px; text-transform:uppercase; color:${color}; font-weight:bold;">${inline(text)}</p>`;
}

function valueText(html, size = 17, bold = false) {
  return `<p style="margin:0; ${FONT} font-size:${size}px; line-height:${Math.round(size * 1.47)}px; color:${BRAND.ink};${bold ? " font-weight:bold;" : ""}">${html}</p>`;
}

// Card title and opening message.
function intro(form) {
  const parts = [];
  if (has(form.title)) {
    parts.push(`<h2 style="margin:0; ${FONT} font-size:28px; line-height:34px; color:${BRAND.darkGreen}; font-weight:bold; mso-line-height-rule:exactly;">${inline(form.title)}</h2>`);
  }
  if (has(form.intro)) parts.push(parts.length ? spacedTable(rich(form.intro), 14) : rich(form.intro));
  return parts.length ? block(parts.join("\n"), 0) : "";
}

// Optional divider, optional heading, then content.
function section(title, contentHtml, { rule = true, paddingTop = 24 } = {}) {
  if (!has(title) && !has(contentHtml)) return "";
  const heading = has(title) ? sectionTitle(title) : "";
  const body = heading && has(contentHtml) ? spacedTable(contentHtml, 12) : contentHtml;
  return `${rule ? divider() : ""}${block(`${heading}${body}`, rule ? 24 : paddingTop)}`;
}

// A section whose text comes from a field; left out when the field is empty.
function textSection(title, text, options) {
  return has(text) ? section(title, rich(text), options) : "";
}

// A colored box with a left accent bar, optional bold title, and body.
function callout(tone, { title = "", body = "", html = "" } = {}, paddingTop = 18) {
  if (!has(title) && !has(body) && !has(html)) return "";
  const t = TONES[tone];
  const titleHtml = has(title)
    ? `<p style="margin:0 0 ${has(body) || has(html) ? 6 : 0}px 0; ${FONT} font-size:16px; line-height:24px; font-weight:bold; color:${t.title};">${inline(title)}</p>`
    : "";
  return block(`
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${t.background}" style="border-collapse:collapse; background-color:${t.background};">
                    <tr>
                      <td style="padding:16px 18px; background-color:${t.background}; border:1px solid ${t.border}; border-left:${t.width}px solid ${t.accent};">
                        ${titleHtml}${html}${has(body) ? rich(body, has(title) ? 14 : 16, has(title) ? BRAND.muted : BRAND.text) : ""}
                      </td>
                    </tr>
                  </table>`, paddingTop);
}

// Gold box that highlights one CMS value, like a tracking number or eBook code.
function valueBox(label, token, note) {
  return callout("note", {
    html: `${smallLabel(label, "#6b6738")}${valueText(token, 22, true)}${has(note) ? spacedTable(rich(note, 14, BRAND.muted), 8) : ""}`
  });
}

// One row of two label/value groups, preceded by a divider. Stacks on phones.
// Each side is a list of [label, valueHtml] pairs.
function detailRow(left, right, { rule = true } = {}) {
  const cell = (pairs, side) => {
    const padding = side === "left" ? "0 12px 0 0" : "0 0 0 12px";
    const inner = pairs.map(([label, html], i) => (i ? spacedTable(smallLabel(label) + html, 16) : smallLabel(label) + html)).join("");
    return `<td class="stack" width="50%" valign="top" style="width:50%; padding:${padding};">${inner}</td>`;
  };
  return `${rule ? divider() : ""}${block(`
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                    <tr>
                      ${cell(left, "left")}
                      ${cell(right, "right")}
                    </tr>
                  </table>`, rule ? 22 : 28)}`;
}

// Value plus a small note under it (e.g. requested pickup date).
function valueWithNote(token, note) {
  return `${valueText(token)}${has(note) ? spacedTable(`<p style="margin:0; ${FONT} font-size:12px; line-height:18px; color:${BRAND.muted};">${inline(note)}</p>`, 6) : ""}`;
}

// A list of items from the CMS, with optional notes and a right-aligned total.
function itemGroup(title, itemsToken, { total = "", noteBefore = "", noteAfter = "" } = {}) {
  const parts = [];
  if (has(noteBefore)) parts.push(rich(noteBefore, 14, BRAND.muted));
  parts.push(parts.length ? spacedTable(valueText(itemsToken, 15), 10) : valueText(itemsToken, 15));
  if (has(noteAfter)) parts.push(spacedTable(rich(noteAfter, 14, BRAND.muted), 10));
  if (has(total)) parts.push(spacedTable(`<p style="margin:0; ${FONT} font-size:14px; line-height:21px; color:${BRAND.muted}; font-weight:bold; text-align:right;">${inline(total)}</p>`, 10));
  return section(title, parts.join(""));
}

// rows: [label, token, highlight?]; highlight shows the value in discount orange.
function totals(rows, finalLabel, finalToken) {
  const lineRows = rows.map(([label, token, highlight]) => `
                      <tr>
                        <td style="padding:6px 10px 6px 0; ${FONT} font-size:16px; line-height:24px; color:${BRAND.text}; font-weight:bold;">${inline(label)}</td>
                        <td align="right" style="padding:6px 0; ${FONT} font-size:16px; line-height:24px; color:${highlight ? BRAND.discount : BRAND.ink}; text-align:right;">${token}</td>
                      </tr>`).join("");
  return section("Order Total", `
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${lineRows}
                      <tr>
                        <td style="padding:12px 10px 0 0; ${FONT} font-size:24px; line-height:30px; color:${BRAND.darkGreen}; font-weight:bold;">${inline(finalLabel)}</td>
                        <td align="right" style="padding:12px 0 0 0; ${FONT} font-size:24px; line-height:30px; color:${BRAND.darkGreen}; font-weight:bold; text-align:right;">${finalToken}</td>
                      </tr>
                    </table>`);
}

// Small-print footnotes in a box under the totals.
function footnotes(tone, text) {
  return has(text) ? callout(tone, { html: rich(text, 12, BRAND.muted) }, 20) : "";
}

// Optional closing/delay alert from the toggle at the bottom of the form.
function alertCallout(form) {
  if (!form.includeAlert) return "";
  const start = prettyDateTime(form.alertStart);
  const end = prettyDateTime(form.alertEnd);
  const timing = start || end
    ? spacedTable(`<p style="margin:0; ${FONT} font-size:13px; line-height:20px; color:#8c4b14;"><strong>Timing:</strong> ${escapeHtml(start || "Now")}${end ? ` through ${escapeHtml(end)}` : ""}</p>`, 8)
    : "";
  return callout("alert", {
    title: form.alertHeadline.trim() || "Closing / Delay Alert",
    html: rich(form.alertMessage, 15) + timing
  });
}

function prettyDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"
  }).format(date);
}

/* ---------- The one shared layout ---------- */

function emailShell(template, form, bodyRows) {
  const preheader = has(form.preheader)
    ? `<div style="display:none; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; mso-hide:all;">${safeText(form.preheader.trim())}${"&#847;&zwnj;&nbsp;".repeat(40)}</div>`
    : "";
  const footerLine = (text, size, lineHeight) => has(text)
    ? `<p style="margin:0 0 16px 0; ${FONT} font-size:${size}px; line-height:${lineHeight}px; color:#f2f6f3;">${inline(text.trim())}</p>`
    : "";
  const eyebrow = has(form.eyebrow)
    ? `<p style="margin:0 0 10px 0; ${FONT} font-size:12px; line-height:18px; letter-spacing:1px; text-transform:uppercase; color:${BRAND.gold}; font-weight:bold;">${inline(form.eyebrow)}</p>`
    : "";
  const subhead = has(form.subhead)
    ? `<p style="margin:10px 0 0 0; ${FONT} font-size:15px; line-height:22px; color:#dce7dc;">${inline(form.subhead)}</p>`
    : "";
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${safeText(template.title)}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    body, table, td, p, a, li { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { -ms-interpolation-mode:bicubic; }
    @media only screen and (max-width:620px) {
      .email-pad { padding-left:22px !important; padding-right:22px !important; }
      .stack { display:block !important; width:100% !important; padding:0 0 16px 0 !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; width:100%; background-color:${BRAND.page};">
  ${preheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.page}" style="width:100%; border-collapse:collapse; background-color:${BRAND.page};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <!--[if mso]><table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px; border-collapse:collapse;">
          <tr>
            <td class="email-pad" bgcolor="${BRAND.green}" style="padding:32px; background-color:${BRAND.green};">
              <img src="${BRAND.logoUrl}" alt="CSU Bookstore" width="200" style="display:block; width:200px; max-width:100%; height:auto; border:0; outline:none; text-decoration:none; ${FONT} font-size:20px; font-weight:bold; color:#ffffff;">
              ${spacedTable(`${eyebrow}
                  <h1 style="margin:0; ${FONT} font-size:30px; line-height:36px; color:#ffffff; font-weight:bold; mso-line-height-rule:exactly;">${inline(form.heroHeadline)}</h1>
                  ${subhead}`, 18)}
            </td>
          </tr>
          <tr>
            <td class="email-pad" bgcolor="${BRAND.cream}" style="padding:32px; background-color:${BRAND.cream}; border-left:1px solid ${BRAND.line}; border-right:1px solid ${BRAND.line};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${bodyRows.join("")}
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-pad" bgcolor="${BRAND.green}" style="padding:24px; background-color:${BRAND.green};">
              ${footerLine(form.footerThanks, 13, 20)}
              ${footerLine(form.footerNotice, 11, 17)}
              <p style="margin:0; ${FONT} font-size:13px; line-height:20px; color:#f2f6f3;">${FOOTER_ADDRESS}</p>
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ---------- Shared wording ---------- */

const THANKS_SHOPPING = "Thank you for shopping at the CSU Bookstore. The CSU Bookstore is owned and operated by Colorado State University and returns all revenues to CSU for student programs and services.";
const THANKS_SHOPPING_EXCLAIM = "Thank you for shopping at the CSU Bookstore! The CSU Bookstore is owned and operated by Colorado State University and returns all revenues to CSU for student programs and services.";
const THANKS_CHOOSING = "Thank you for choosing the CSU Bookstore. The CSU Bookstore is owned and operated by Colorado State University, and returns all revenues to the University to fund student programs and services.";
const NOTICE_RECEIVED = "You are receiving this email because you made a purchase from the CSU Bookstore. This transactional email confirms the CSU Bookstore received your order.";
const CANCEL_LINK = "[bookstore.colostate.edu/cancel](https://www.bookstore.colostate.edu/cancel)";
const RETURNS_LINK = "[bookstore.colostate.edu/returns-exchanges](https://www.bookstore.colostate.edu/returns-exchanges)";

// Field helper: key, label, default value, textarea rows (1 = single line).
function f(key, label, value = "", rows, extra = {}) {
  const autoRows = value.length > 220 ? 6 : value.length > 90 ? 3 : 1;
  return { key, label, value, rows: rows || autoRows, ...extra };
}

/* ---------- Rental term details ----------
 * Rental emails repeat the semester and dates in several places. Staff set
 * them once in these fields; the wording uses the placeholders below.
 *   {semester}      Summer 2026
 *   {dueDate}       Friday, August 7, 2026
 *   {dueDateShort}  August 7, 2026
 *   {lateFeeDate}   August 12, 2026
 *   {lateFee}       $25
 *   {chargeDate}    August 14, 2026
 */
function rentalTermFields() {
  return [
    f("semester", "Semester", "Summer 2026", 1, { heading: "Rental term (change these each term)", half: true }),
    f("lateFee", "Late fee amount", "$25", 1, { half: true }),
    f("dueDate", "Due date", "2026-08-07", 1, { type: "date", third: true }),
    f("lateFeeDate", "Late fee after", "2026-08-12", 1, { type: "date", third: true }),
    f("chargeDate", "Charged to student account after", "2026-08-14", 1, { type: "date", third: true, note: "Use {semester}, {dueDate}, {dueDateShort}, {lateFeeDate}, {lateFee} and {chargeDate} in the wording below. They fill in from these fields." })
  ];
}

function formatTermDate(value, withWeekday) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  if (!match) return "[date]";
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Intl.DateTimeFormat("en-US", { ...(withWeekday ? { weekday: "long" } : {}), month: "long", day: "numeric", year: "numeric" }).format(date);
}

// Replace {placeholders} in every text field with the rental term values.
function applyRentalTerm(form) {
  const values = {
    semester: form.semester.trim() || "[semester]",
    dueDate: formatTermDate(form.dueDate, true),
    dueDateShort: formatTermDate(form.dueDate, false),
    lateFeeDate: formatTermDate(form.lateFeeDate, false),
    lateFee: form.lateFee.trim() || "[late fee]",
    chargeDate: formatTermDate(form.chargeDate, false)
  };
  Object.keys(form).forEach((key) => {
    if (typeof form[key] === "string") {
      form[key] = form[key].replace(/\{(semester|dueDate|dueDateShort|lateFeeDate|lateFee|chargeDate)\}/g, (m, name) => values[name]);
    }
  });
  return form;
}

// Header, title and opening fields every email has.
function topFields({ preheader = "", eyebrow = "", heroHeadline = "", subhead = "", title = "", intro = "" }) {
  return [
    f("preheader", "Inbox preview text (hidden in the email)", preheader, 2),
    f("eyebrow", "Header: small gold label (optional)", eyebrow, 1),
    f("heroHeadline", "Header: headline", heroHeadline, 1),
    f("subhead", "Header: line under the headline (optional)", subhead, 1),
    f("title", "Card: title (optional)", title, 1),
    f("intro", "Card: opening message", intro)
  ];
}

function footerFields(thanks, notice = "") {
  return [
    f("footerThanks", "Footer: thank-you message", thanks, 3),
    f("footerNotice", "Footer: why you received this email (optional)", notice, 3)
  ];
}

const ORDER_DETAILS_HEADING = "Order #<<<ORDERNUM>>> Details";

/* ---------- Templates: wording and which blocks to use ---------- */

const EMAIL_TEMPLATES = [
  {
    id: "order-confirmation",
    name: "Order Confirmation",
    title: "CSU Bookstore Order Confirmation",
    fields: [
      ...topFields({
        preheader: "We received your CSU Bookstore order #<<<ORDERNUM>>>. We’ll begin processing it soon and send another update before it ships or is ready for pickup.",
        heroHeadline: "Order <<<ORDERNUM>>> Received",
        subhead: "Thank you for your order from the CSU Bookstore.",
        title: "Thank you for your order.",
        intro: "We received your order and will begin processing it soon."
      }),
      f("pickupNote", "Green box: in-store pickup note", "**If you selected in-store pickup, please wait for a pickup notification before coming to the bookstore.**", 2),
      f("processing", "Section: “How long will my order take?”", "- Orders received **before 2:00 p.m. Mountain Time** are processed the same business day and are typically available for pickup by **3:00 p.m.**\n- Orders received **after 2:00 p.m. Mountain Time** are processed the next business day and are typically available for pickup by **3:00 p.m.**\n- Orders received **after 2:00 p.m. on Fridays** are processed the next business day, typically Monday.", 6),
      f("pickupDateNote", "Requested Pickup Date: small print", "When applicable. Pickup orders are completed by or before 3:00 p.m. on the requested date and may be ready sooner.", 2),
      f("footnotes", "Small print under the totals", "* Your final total may change after processing due to course material availability, shipping adjustments, or applicable sales tax. Your final total will appear on the receipt included with your shipment and/or your pickup or shipping confirmation email.\n\n** Sales tax is calculated when your order is processed. The CSU Bookstore collects applicable sales tax on in-store pickup orders and on orders shipped to destinations where sales tax is required by law.\n\n**Purchasing tax exempt?** Please send a copy of your tax exemption certificate to BookstoreOrders@colostate.edu.", 8),
      f("help", "Section: “Need help?”", `Have questions about your order? Email BookstoreOrders@colostate.edu or call 970-491-0904 between 8 a.m. and 4 p.m. Mountain Time.\n\nNeed to cancel your order? Use the cancellation form at ${CANCEL_LINK}.`, 4),
      ...footerFields(THANKS_SHOPPING, "You are receiving this email because you made a purchase from the CSU Bookstore. This transactional email confirms that the CSU Bookstore received your order.")
    ],
    body: (form) => [
      intro(form),
      callout("info", { body: form.pickupNote }),
      alertCallout(form),
      textSection("How long will my order take?", form.processing, { rule: false, paddingTop: 28 }),
      detailRow([["Payment Method", valueText("<<<PAYMETHOD>>>")]], [["Fulfillment Method", valueText("<<<SHIPMETHOD>>>")]], { rule: false }),
      detailRow([["Shipping Address", valueText("<<<SHIPADDRESS>>>")]], [["Billing Address", valueText("<<<BILLADDRESS>>>")]]),
      detailRow([["Requested Pickup Date", valueWithNote("<<<PICKUPDATE>>>", form.pickupDateNote)]], [["Promo Code", valueText("<<<PROMOCODE>>>")], ["Order Notes", valueText("<<<CUSTORDNOTES>>>", 16)]]),
      itemGroup("Course Materials Ordered", "<<<CRSBK-NOUPDATE>>><<<CRSBK-NOINSTR>>><<<CSBKLNITEM>>>", { total: "Total Course Materials Ordered*: <<<DOLLARBOOKS>>>" }),
      itemGroup("Merchandise or Supplies Ordered", "<<<MERLNITEM>>>", { total: "Total Merchandise or Supplies Ordered*: <<<DOLLARMER>>>" }),
      itemGroup("General Books Ordered", "<<<TRADELNITEM>>>", { total: "Total General Books Ordered*: <<<DOLLARTRADE>>>" }),
      totals([
        ["Order Discounts Applied", "<<<ORDERDISCOUNT>>>"],
        ["Item Discounts Applied", "<<<ITEMDISCOUNT>>>"],
        ["Shipping Charges", "<<<SHIPCHARGE>>>"],
        ["Shipping Discounts Applied", "<<<SHIPDISCOUNT>>>", true],
        ["Subtotal", "<<<SUBTOTAL>>>"],
        ["Tax**", "<<<TAX>>>"]
      ], "Total", "<<<GRANDTOTAL>>>"),
      footnotes("note", form.footnotes),
      textSection("Need help?", form.help)
    ]
  },
  {
    id: "pending-status",
    name: "Pending Status (Additional Information Needed)",
    title: "Pending Status Email",
    fields: [
      ...topFields({
        heroHeadline: "Order <<<ORDERNUM>>> Requires Additional Information",
        intro: "Hello <<<CUSTOMERNAME>>>,\n\nThank you for your recent order from the CSU Bookstore. **We need additional information from you** to complete and process your order.\n\nYour order is currently in **Pending** status and will remain pending until the requested information below is received. Please complete the steps within **72 hours** to avoid cancellation.\n\nOnce the requested information has been provided and reviewed, you will receive an order confirmation email when your order moves out of Pending status."
      }),
      f("importantTitle", "Orange box: title", "IMPORTANT", 1),
      f("important", "Orange box: message", "**There is no problem with your credit card. You do not need to change your payment method or cancel your order.**\n\n**FOR YOUR SAFETY, DO NOT SEND CREDIT CARD INFORMATION OVER EMAIL.**", 4),
      f("nextSteps", "Section: “Next Steps”", "- Reply to this email with updated or confirmed billing address information (the address your bank has on file). Residence hall addresses are typically not valid billing addresses.\n- **Attention Students:** Your residence hall address is not your permanent billing address. Please provide the permanent billing address associated with your bank.\n- **International / non-U.S. cards:** Some international credit or debit cards do not support Address Verification (AVS) and may require manual review. If your card was issued outside the United States, please reply to this email so we can review your order.\n- **Do NOT send credit card information over email. Credit card information sent over email is not secure.**\n- Your order will move out of Pending status once the information is approved and you receive a confirmation email from the CSU Bookstore.\n\n**Unresolved Pending orders may be cancelled 72 hours after initial notification.**", 10),
      f("why", "Section: “Why Orders May Be Placed in Pending Status”", "Orders may be placed in **Pending** status for several common reasons, including:\n- The billing address entered at checkout did not match the address on file with your credit or debit card's issuing bank.\n- If you moved recently, your bank may still have a former address on file.\n- Address numbers or ZIP codes may contain a transposed digit.\n- Some banks—particularly outside the United States—do not use Address Verification (AVS) or ZIP code verification systems.\n\nThe following message from our credit card processor explains why your order was placed in Pending status: **<<<AVSRESPONSE>>>**\n\nFor reference, the billing address you provided at checkout was:\n<<<BILLADDRESS>>>", 10),
      f("pickupDateNote", "Requested Pick Up Date: small print", "Orders in pending status may require an additional day from the requested pickup date.", 2),
      ...footerFields("The CSU Bookstore is owned and operated by Colorado State University, and returns all revenues to the University to fund student programs and services.")
    ],
    body: (form) => [
      intro(form),
      callout("alert", { title: form.importantTitle, html: rich(form.important, 15) }),
      alertCallout(form),
      textSection("Next Steps", form.nextSteps),
      textSection("Why Orders May Be Placed in Pending Status", form.why),
      section(ORDER_DETAILS_HEADING, ""),
      detailRow([["Billing Address", valueText("<<<BILLADDRESS>>>")]], [["Shipping Address", valueText("<<<SHIPADDRESS>>>")]], { rule: false }),
      detailRow([["Payment Method", valueText("<<<PAYMETHOD>>>")]], [["Fulfillment Method", valueText("<<<SHIPMETHOD>>>")]]),
      detailRow([["Requested Pick Up Date (If Applicable)", valueWithNote("<<<PICKUPDATE>>>", form.pickupDateNote)]], [["Promo Code (If Applicable)", valueText("<<<PROMOCODE>>>")], ["Customer Order Notes (If Provided)", valueText("<<<CUSTORDNOTES>>>", 16)]]),
      itemGroup("Course Materials Ordered", "<<<CRSBK-NOUPDATE>>><<<CRSBK-NOINSTR>>><<<CSBKLNITEM>>>", { total: "Total Course Materials Ordered: <<<DOLLARBOOKS>>>" }),
      itemGroup("Merchandise or Supplies Ordered", "<<<MERLNITEM>>>", { total: "Total Merchandise or Supplies Ordered: <<<DOLLARMER>>>" }),
      itemGroup("General Books Ordered", "<<<TRADELNITEM>>>", { total: "Total General Books Ordered: <<<DOLLARTRADE>>>" })
    ]
  },
  {
    id: "item-on-backorder",
    name: "Item on Backorder (Special Order)",
    title: "Item on Backorder",
    fields: [
      ...topFields({
        preheader: "CSU Bookstore order #<<<ORDERNUM>>> has backordered item(s). This email explains how we are taking care of your order.",
        heroHeadline: "We created a special order for your CSU Bookstore order.",
        intro: "Thank you for placing an order with the CSU Bookstore.\nWe are currently out of stock of the item(s) listed below from Order <<<ORDERNUM>>>. To ensure you still receive it, we have placed a **special order** on your behalf and will fulfill it once new stock becomes available."
      }),
      f("notCharged", "Text under the backordered items", "You have not been charged for the item(s) listed above.", 1),
      f("nextSteps", "Section: “What Happens Next?”", "- **Please do not place another order** for the item(s). When stock arrives, you will receive the item(s), and we will charge it to your **<<<PAYMETHOD>>>**.\n- We are receiving more stock to fulfill your order. The Special Order we submitted reserves the item(s) for you.\n- You will receive an email when the item(s) are ready to pick up. If we ship your order, you will get an email before it ships.\n\nMost special orders are fulfilled within 5-7 business days, and many arrive much sooner. Fulfillment times may vary in some cases due to factors beyond our control.", 8),
      f("cancelTitle", "Green box: title", "If you Wish to Cancel Your Order", 1),
      f("cancel", "Green box: message", `If you wish to cancel all or part of this order, please complete our cancellation form at ${CANCEL_LINK}`, 3),
      ...footerFields(THANKS_SHOPPING_EXCLAIM, NOTICE_RECEIVED)
    ],
    body: (form) => [
      intro(form),
      callout("info", { html: valueText("<<<NOTPACKED>>>", 16) }),
      has(form.notCharged) ? block(rich(form.notCharged), 18) : "",
      alertCallout(form),
      textSection("What Happens Next?", form.nextSteps),
      callout("info", { title: form.cancelTitle, body: form.cancel }),
      section(ORDER_DETAILS_HEADING, ""),
      itemGroup("Course Materials Ordered", "<<<CRSBK-NOUPDATE>>><<<CRSBK-NOINSTR>>><<<CSBKLNITEM>>>", { total: "Total Course Materials Ordered: <<<DOLLARBOOKS>>>" }),
      itemGroup("Merchandise or Supplies Ordered", "<<<MERLNITEM>>>", { total: "Total Merchandise or Supplies Ordered: <<<DOLLARMER>>>" }),
      itemGroup("General Books Ordered", "<<<TRADELNITEM>>>", { total: "Total General Books Ordered: <<<DOLLARTRADE>>>" })
    ]
  },
  {
    id: "order-processed",
    name: "Order Processed (Almost Ready)",
    title: "CSU Bookstore Shipping Confirmation",
    fields: [
      ...topFields({
        preheader: "Your order is almost ready. We completed processing CSU Bookstore order <<<ORDERNUM>>> and it will be fulfilled via <<<SHIPMETHOD>>>.",
        eyebrow: "CSU Bookstore",
        heroHeadline: "Your Order Is Almost Ready",
        subhead: "We’ve completed processing your order, and the next fulfillment step is underway.",
        title: "CSU Bookstore Order #<<<ORDERNUM>>> Has Been Processed",
        intro: "We have completed processing CSU Bookstore order #<<<ORDERNUM>>>. Your order will be fulfilled via **<<<SHIPMETHOD>>>**. If your order ships via Standard, Expedited, or International shipping methods, you will receive another email with tracking information.\n\n- **Decals and Gift Cards Shipping:** If you selected our \"Decals and Gift Cards\" shipping option, this is the final email you will receive regarding your order. These shipments are mailed via USPS First-Class Mail and do not include tracking information. Please allow up to 14 business days for delivery.\n- **Custom Yard Signs/Banners/Ornaments, Lands' End, and Other Drop Ship Items:** If your order includes a drop shipped item such as a yard sign, Lands' End apparel item, custom furniture, or custom item, we have submitted your order to the vendor for processing. We will provide you with tracking information as we receive it."
      }),
      f("satisfactionTitle", "Green box: title", "Your satisfaction is our priority.", 1),
      f("satisfaction", "Green box: message", "Your order was double-checked for accuracy and packed carefully to avoid damage to your merchandise or course materials. If your shipment arrives and we did not meet your expectations, please email BookstoreOrders@colostate.edu or call 970-491-0904 for assistance.", 4),
      f("returnsTitle", "Gold box: title", "Returns and Exchanges", 1),
      f("returns", "Gold box: message", `If you need to return or exchange any items on your order, please visit ${RETURNS_LINK}. Please note that shipping charges are non-refundable.`, 3),
      f("notPackedNote", "Items Not Packed: note above the list", "Any items listed below were not packed with this order. They may be on back order or may have been removed from your order. Please email BookstoreOrders@colostate.edu for assistance.", 3),
      f("footnotes", "Small print under the totals", "* Sales tax in some jurisdictions may change over time, so the tax amount assessed may differ from your original order depending on when the order is processed.", 3),
      ...footerFields(THANKS_SHOPPING, "You are receiving this email because you made a purchase from the CSU Bookstore. This transactional email alerts you that the order you placed has been processed for fulfillment.")
    ],
    body: (form) => [
      intro(form),
      alertCallout(form),
      callout("info", { title: form.satisfactionTitle, body: form.satisfaction }, 24),
      callout("note", { title: form.returnsTitle, body: form.returns }),
      detailRow([["Billing Address", valueText("<<<BILLADDRESS>>>")]], [["Shipping Address", valueText("<<<SHIPADDRESS>>>")]]),
      detailRow([["Payment Method", valueText("<<<PAYMETHOD>>>")]], [["Shipment Method", valueText("<<<SHIPMETHOD>>>")]]),
      itemGroup("Course Materials Packed", "<<<CSBKLNITEM>>><<<CRSBK-NOINSTR>>><<<CRSBK-NOUPDATE>>>"),
      itemGroup("Merchandise or Supplies Packed", "<<<MERLNITEM>>>"),
      itemGroup("General Books Packed", "<<<TRADELNITEM>>>"),
      itemGroup("Items Not Packed", "<<<NOTPACKED>>>", { noteBefore: form.notPackedNote }),
      totals([
        ["Discounts Applied to Order", "<<<ITEMDISCOUNT>>>", true],
        ["Handling Charges", "<<<HANDLECHARGE>>>"],
        ["Shipping Charges", "<<<SHIPCHARGE>>>"],
        ["Shipping Discounts", "<<<SHIPDISCOUNT>>>", true],
        ["Subtotal", "<<<SUBTOTAL>>>"],
        ["Tax", "<<<TAX>>>"]
      ], "Grand Total", "<<<GRANDTOTAL>>>"),
      footnotes("alert", form.footnotes)
    ]
  },
  {
    id: "shipping-confirmation",
    name: "Shipping Confirmation (with Tracking)",
    title: "CSU Bookstore Shipping Confirmation",
    fields: [
      ...topFields({
        preheader: "CSU Bookstore order <<<ORDERNUM>>> has shipped. Your package went out via <<<SHIPMETHOD>>> with tracking number <<<TRACKNUM>>>.",
        eyebrow: "CSU Bookstore",
        heroHeadline: "Order <<<ORDERNUM>>> Has Shipped",
        subhead: "Your order is on the way.",
        title: "Your shipment is on its way.",
        intro: "Thank you for shopping at the CSU Bookstore. We shipped your order via <<<SHIPMETHOD>>>."
      }),
      f("trackingNote", "Tracking box: note", "If the tracking page is not yet updated, please allow time for the shipment to scan into their system.", 2),
      f("satisfactionTitle", "Green box: title", "Your satisfaction is our priority.", 1),
      f("satisfaction", "Green box: message", "Your order was double-checked for accuracy and packed carefully to help prevent damage to your merchandise or course materials.\n\nIf your shipment arrives and we did not meet your expectations, please email BookstoreOrders@colostate.edu or call 970-491-0904 for assistance.", 4),
      f("returnsTitle", "Orange box: title", "Returns and Exchanges", 1),
      f("returns", "Orange box: message", `If you need to return or exchange any items on your order, please visit ${RETURNS_LINK}. Please note that shipping charges are non-refundable.`, 3),
      f("notPackedNote", "Items Not Packed: note under the list", "The item or items listed above were not packed in this portion of your order. The reason is provided. You will receive another email when your backordered items are ready to ship. **Your <<<PAYMETHOD>>> was not charged for items that were not packed.**", 4),
      f("footnotes", "Small print under the totals", "* Your final total may have changed after processing due to adjustments in course material availability, such as new or used condition changes, or sales tax.", 3),
      f("help", "Section: “Need help?”", "Have questions about your order? Email BookstoreOrders@colostate.edu or call 970-491-0904 between 8 a.m. and 4 p.m. Mountain Time for assistance.", 3),
      ...footerFields(THANKS_SHOPPING, "You are receiving this email because you made a purchase from the CSU Bookstore. This transactional email provides tracking information for your order.")
    ],
    body: (form) => [
      intro(form),
      valueBox("Tracking Number", "<<<TRACKNUM>>>", form.trackingNote),
      alertCallout(form),
      callout("info", { title: form.satisfactionTitle, body: form.satisfaction }),
      callout("alert", { title: form.returnsTitle, body: form.returns }),
      detailRow([["Payment Method", valueText("<<<PAYMETHOD>>>")]], [["Shipping Method", valueText("<<<SHIPMETHOD>>>")]]),
      detailRow([["Shipping Address", valueText("<<<SHIPADDRESS>>>")]], [["Billing Address", valueText("<<<BILLADDRESS>>>")]]),
      detailRow([["Date Shipped", valueText("<<<DATEPACKSHIP>>>")]], [["Promo Code", valueText("<<<PROMOCODE>>>")], ["Order Notes", valueText("<<<CUSTORDNOTES>>>", 16)]]),
      itemGroup("Course Materials Shipped", "<<<CRSBK-NOUPDATE>>><<<CRSBK-NOINSTR>>><<<CSBKLNITEM>>>", { total: "Total Course Materials Charged to <<<PAYMETHOD>>>: <<<DOLLARBOOKS>>>" }),
      itemGroup("Merchandise or Supplies Shipped", "<<<MERLNITEM>>>", { total: "Total Merchandise or Supplies Charged to <<<PAYMETHOD>>>: <<<DOLLARMER>>>" }),
      itemGroup("General Books Shipped", "<<<TRADELNITEM>>>", { total: "Total General Books Charged to <<<PAYMETHOD>>>: <<<DOLLARTRADE>>>" }),
      itemGroup("Items Not Packed", "<<<NOTPACKED>>>", { noteAfter: form.notPackedNote }),
      totals([
        ["Shipping Charges", "<<<SHIPCHARGE>>>"],
        ["Shipping Discounts", "<<<SHIPDISCOUNT>>>", true],
        ["Item Discounts Applied", "<<<ITEMDISCOUNT>>>"],
        ["Order Discounts Applied", "<<<ORDERDISCOUNT>>>", true],
        ["Subtotal", "<<<SUBTOTAL>>>"],
        ["Tax", "<<<TAX>>>"]
      ], "Grand Total", "<<<GRANDTOTAL>>>"),
      footnotes("alert", form.footnotes),
      textSection("Need help?", form.help)
    ]
  },
  {
    id: "ready-for-pickup",
    name: "Order Ready for Pickup",
    title: "CSU Bookstore Order Ready for Pickup",
    fields: [
      ...topFields({
        preheader: "CSU Bookstore Order <<<ORDERNUM>>> is Ready to Pick Up! Open this email to get more details about your order and how to pick it up at the CSU Bookstore.",
        heroHeadline: "Order <<<ORDERNUM>>> is Ready to Pick Up!",
        intro: "Thank you for shopping at the CSU Bookstore. Your order is now ready to pick up at the CSU Bookstore. Please bring this email (on your phone or printed) and a photo ID when picking up your order."
      }),
      f("whereWhen", "Section: “Where and When Can I Pick Up My Order?”", "You can pick up your order from the **Order Pickup Counter**, located on the lower level of the CSU Bookstore.\n\nPick-up hours are **Monday – Friday** from **8 am to 5 pm**. If you need to pick up your order outside of these hours, please email BookstoreOrders@colostate.edu to make alternate arrangements.", 5),
      f("gameDayTitle", "Green box: title", "Want to Pick Up before the CSU Football Game?", 1),
      f("gameDay", "Green box: message", "Please email BookstoreOrders@colostate.edu for instructions on picking up your order on Game Day.", 2),
      f("deadline", "Gold box: pickup deadline", "**Please pick up your order within 21 days. Orders not picked up within 21 days will be refunded and restocked.**", 2),
      f("someoneElseTitle", "Gold box: title", "Can Someone Else Pick Up My Order?", 1),
      f("someoneElse", "Gold box: message", "Yes! Send an email to BookstoreOrders@colostate.edu with the name of the person picking up your order so we can make a note on our end. Please share your order number and pick up details they will need to pick up your order.", 4),
      f("help", "Help and cancellation (no heading)", `Have questions about your order? Email BookstoreOrders@colostate.edu or call 970-491-0904 between 8 a.m. and 4 p.m. Mountain Time for assistance.\n\nChanged your mind and need to cancel your order? Use our cancellation form at ${CANCEL_LINK}`, 4),
      f("notPackedNote", "Items Not Packed: note under the list", "The item(s) listed above were not packed in this portion of your order. The reason it was not packed is provided. You will receive another email when your backordered items are ready to pick up. **Your <<<PAYMETHOD>>> was not charged for the items we did not pack.**", 4),
      f("footnotes", "Small print under the totals", "* Your final total may have changed after processing due to adjustments in course material availability (new/used) or sales tax.", 3),
      ...footerFields(THANKS_SHOPPING_EXCLAIM, "You are receiving this email because you made a purchase from the CSU Bookstore. This transactional email confirms your order is ready to pick up.")
    ],
    body: (form) => [
      intro(form),
      alertCallout(form),
      textSection("Where and When Can I Pick Up My Order?", form.whereWhen),
      callout("info", { title: form.gameDayTitle, body: form.gameDay }),
      callout("note", { body: form.deadline }),
      callout("note", { title: form.someoneElseTitle, body: form.someoneElse }),
      textSection("", form.help),
      section("Order #<<<ORDERNUM>>> Pick Up Summary", ""),
      detailRow([["Payment Method", valueText("<<<PAYMETHOD>>>")]], [["Fulfillment Method", valueText("<<<SHIPMETHOD>>>")]], { rule: false }),
      detailRow([["Shipping Address", valueText("Pick Up at the CSU Bookstore")]], [["Billing Address", valueText("<<<BILLADDRESS>>>")]]),
      detailRow([["Date Order Packed", valueText("<<<DATEPACKSHIP>>>")]], [["Promo Code (If Applicable)", valueText("<<<PROMOCODE>>>")], ["Order Notes (If Applicable)", valueText("<<<CUSTORDNOTES>>>", 16)]]),
      itemGroup("Course Materials Packed", "<<<CRSBK-NOUPDATE>>><<<CRSBK-NOINSTR>>><<<CSBKLNITEM>>>", { total: "Total Course Materials Charged to <<<PAYMETHOD>>>: <<<DOLLARBOOKS>>>" }),
      itemGroup("Merchandise or Supplies Packed", "<<<MERLNITEM>>>", { total: "Total Merchandise or Supplies Charged to <<<PAYMETHOD>>>*: <<<DOLLARMER>>>" }),
      itemGroup("General Books Packed", "<<<TRADELNITEM>>>", { total: "Total General Books Charged to <<<PAYMETHOD>>>*: <<<DOLLARTRADE>>>" }),
      itemGroup("Items Not Packed", "<<<NOTPACKED>>>", { noteAfter: form.notPackedNote }),
      totals([
        ["Item Discounts Applied", "<<<ITEMDISCOUNT>>>"],
        ["Order Discounts Applied", "<<<ORDERDISCOUNT>>>"],
        ["Subtotal", "<<<SUBTOTAL>>>"],
        ["Tax", "<<<TAX>>>"]
      ], "Total charged to <<<PAYMETHOD>>>", "<<<GRANDTOTAL>>>"),
      footnotes("note", form.footnotes)
    ]
  },
  {
    id: "ebook-activation",
    name: "eBook Activation",
    title: "eBook Activation Email",
    fields: [
      ...topFields({
        preheader: "Your eBook access code for CSU Bookstore Order #<<<ORDERNUM>>> is inside this email. Keep this message for your records.",
        heroHeadline: "eBook Activation Instructions for Order <<<ORDERNUM>>>",
        title: "Your eBook Is Ready!",
        intro: "Hello <<<CUSTOMERNAME>>>,\n\nYour eBook purchase from the CSU Bookstore is ready. If you ordered multiple eBooks, you will receive an email for each eBook you purchased.\n\n**Please keep this email for your records. You may need it to access your eBook again in the future.**"
      }),
      f("codeNote", "Access code box: note", "Use the code above to access your eBook at [bookshelf.vitalsource.com](https://bookshelf.vitalsource.com). You can only redeem this code once.", 2),
      f("redeem", "Section: “How to Redeem Your eBook”", "- Go to VitalSource Bookshelf: [bookshelf.vitalsource.com](https://bookshelf.vitalsource.com/)\n- Sign in or create an account with your **CSU email address**\n- Select **Tools → Redeem Code**\n- Enter your access code\n- Your eBook will appear in your library\n\nNeed more help? View detailed redemption instructions at [VitalSource Support](https://storesupport.vitalsource.com/hc/en-us/articles/32269498278551-How-To-Redeem-A-VitalSource-Access-Code-purchased-at-a-Bookstore-Point-of-Sale-POS).", 8),
      f("refund", "Section: “eBook Refund Information”", `eBooks purchased from the CSU Bookstore may be eligible for refund within 14 days of purchase if all of the following conditions are met:\n- The request is made within 14 days of the **purchase** date\n- No more than 20% of the eTextbook has been viewed or printed\n- Any included access codes for online resources have not been used\n\nRefund requests should be submitted through the **CSU Bookstore Order Cancellation Form** at ${CANCEL_LINK} or by sending your request to BookstoreOrders@colostate.edu.`, 8),
      f("help", "Section: “Need Help Accessing Your eBook?”", `For assistance redeeming or accessing your eBook, visit VitalSource Support: [support.vitalsource.com](https://support.vitalsource.com/hc/en-us)\n\nFor eBook help, please use our eBook Support Form: https://col.st/ydp83.\n\nChanged your mind and need to cancel your order? Use our cancellation form at ${CANCEL_LINK}`, 6),
      ...footerFields(THANKS_SHOPPING_EXCLAIM, "You are receiving this email because you purchased an eBook from the CSU Bookstore website. This transactional email provides the customer information about the eBook purchase and activation instructions.")
    ],
    body: (form) => [
      intro(form),
      valueBox("Your eBook Access Information", "<<<EBOOKINFO>>>", form.codeNote),
      alertCallout(form),
      textSection("How to Redeem Your eBook", form.redeem),
      textSection("eBook Refund Information", form.refund),
      textSection("Need Help Accessing Your eBook?", form.help)
    ]
  },
  {
    id: "refund-confirmation",
    name: "Refund Confirmation",
    title: "Refund Confirmation",
    fields: [
      ...topFields({
        heroHeadline: "CSU Bookstore Refund Confirmation",
        intro: "Hello <<<CUSTOMERNAME>>>,\n\nWe processed a refund for the items listed below from CSU Bookstore **Order Number <<<ORDERNUM>>>** on **<<<REFUNDDATE>>>** to your **<<<PAYMETHOD>>>** in the amount of **<<<REFUNDAMT>>>**."
      }),
      f("refundNote", "Refunded Items: note under the list", "If you do not see any items listed above, we may have refunded shipping or handling fees.", 2),
      f("help", "Closing message (no heading)", "Please allow 24-72 hours for the refund to appear on your credit/debit card account. Please allow more time for refunds to appear on your CSU Student Account. If you have any questions about this refund, please email BookstoreOrders@colostate.edu or call 970-491-0904.", 4),
      ...footerFields(THANKS_CHOOSING)
    ],
    body: (form) => [
      intro(form),
      alertCallout(form),
      itemGroup("Refunded Items:", "<<<REFUNDITEMS>>>", { noteAfter: form.refundNote }),
      textSection("", form.help)
    ]
  },
  {
    id: "order-cancelled",
    name: "Order Cancelled",
    title: "Order Cancellation Email",
    fields: [
      ...topFields({
        heroHeadline: "CSU Bookstore Order #<<<ORDERNUM>>> Cancellation Confirmation",
        intro: "Hello <<<CUSTOMERNAME>>>,\n\nWe are writing to let you know that CSU Bookstore **Order Number <<<ORDERNUM>>>** has been cancelled.\n\nBecause we charge your payment method when we ship or prepare your order for pickup, your <<<PAYMETHOD>>> has not been charged."
      }),
      f("help", "Closing message (no heading)", "If you have any questions about this cancellation, please email BookstoreOrders@colostate.edu or call 970-491-0904.", 2),
      ...footerFields(THANKS_CHOOSING)
    ],
    body: (form) => [
      intro(form),
      alertCallout(form),
      itemGroup("Cancelled Course Material Items:", "<<<CSBKLNITEM>>><<<CRSBK-NOINSTR>>><<<CRSBK-NOUPDATE>>><<<CRSBK-NOCOURSE>>>"),
      itemGroup("Cancelled Merchandise or Supplies Items:", "<<<MERLNITEM>>>"),
      itemGroup("Cancelled General Book Items:", "<<<TRADELNITEM>>>"),
      textSection("", form.help)
    ]
  },
  {
    id: "rental-reminder",
    name: "Rental Reminder (Before Due Date)",
    title: "Rental Reminder",
    rentalTerm: true,
    fields: [
      ...rentalTermFields(),
      ...topFields({
        heroHeadline: "REMINDER: Return Your Rental Books before {dueDateShort}",
        subhead: "Thank you for renting course materials from the CSU Bookstore!",
        intro: "Dear <<<CUSTOMERFNAME>>> <<<CUSTOMERLNAME>>> (Student ID #<<<STUNUM>>>),\n\nThank you for renting course materials from the CSU Bookstore. According to our records, you rented the following book(s) for the **{semester}** semester"
      }),
      f("details", "Section: “Important Details About Your Rented Course Materials”", "- **REMEMBER THAT IT IS YOUR RESPONSIBILITY TO RETURN YOUR RENTED COURSE MATERIALS BEFORE {dueDate}**: Do not forget to return your rental books by the due date to avoid late fees, or replacement fees as described in your rental agreement.\n- **KEEP YOUR RENTED COURSE MATERIALS AWAY FROM LIQUIDS**: Use caution when studying around beverages. We are unable to accept returns on rental books damaged by liquids. We will refund rental pricing and charge the purchase price of the book in this situation.\n- **YES! YOU CAN WRITE/HIGHLIGHT IN YOUR RENTAL BOOK**: You can write notes in the margin and highlight passages in your rental book.", 8),
      f("howToReturn", "Section: “How to RETURN Your Rented Books”", "Rental books for {semester} are due back at the CSU Bookstore on or before {dueDate}. Rental books not returned before {lateFeeDate} will be assessed a {lateFee} late fee; books not returned before {chargeDate} will be charged to your student account after this date.\n\n**Please return your rental book before {dueDate} by:**\n- Returning your rental in person at the CSU Bookstore. You can ask any CSU Bookstore employee for assistance locating the rental return location.\n- **Ship your rental return at your expense to:**", 8),
      f("shipAddress", "Gold box: rental return shipping address", "CSU Bookstore\nATTN: RENTAL RETURNS\n8035 Campus Delivery\nFort Collins, CO 80523\n\n**MAKE SURE YOU INCLUDE YOUR STUDENT ID NUMBER ON THE OUTSIDE OF THE PACKAGE.**", 6),
      f("purchase", "After the address box", "- **IF YOU WISH TO PURCHASE YOUR RENTAL BOOK**: Reply to this email with your name and student ID number. We will charge your student account the difference between the rental price and the purchase price.", 3),
      ...footerFields(THANKS_SHOPPING_EXCLAIM, "You are receiving this email because you rented a textbook from the CSU Bookstore in our store or through our website.")
    ],
    body: (form) => [
      intro(form),
      callout("info", { html: valueText("<<<RENTALNOTICEBOOKS>>><<<RENTALNOTICE-NOFEES>>>", 15) }),
      alertCallout(form),
      textSection("Important Details About Your Rented Course Materials", form.details),
      textSection("How to RETURN Your Rented Books", form.howToReturn),
      callout("note", { body: form.shipAddress }),
      has(form.purchase) ? block(rich(form.purchase), 18) : ""
    ]
  },
  {
    id: "rental-past-due",
    name: "Rental Past Due",
    title: "Rental Past Due",
    rentalTerm: true,
    fields: [
      ...rentalTermFields(),
      ...topFields({
        heroHeadline: "Your Rental Books are Past Due!",
        intro: "Dear <<<CUSTOMERFNAME>>> <<<CUSTOMERLNAME>>> (Student ID #<<<STUNUM>>>),\n\nThank you for renting course materials from the CSU Bookstore. According to our records, you rented the following book(s) for the **{semester}** semester. Our records show these books have not been returned and are now past due."
      }),
      f("howToReturn", "Section: “How to RETURN Your Rented Books”", "Rental books for {semester} were due back at the CSU Bookstore on or before {dueDate}. Rental books not returned before {lateFeeDate} will be assessed a {lateFee} late fee; books not returned before {chargeDate} will be charged to your student account after this date.\n\n**Please return your rental book by:**\n- **Returning your rental in person at the CSU Bookstore**: Please come to the Textbook Information kiosk located in the lower level of the CSU Bookstore for help returning your course materials.\n- **Ship your rental return at your expense to:**", 8),
      f("shipAddress", "Gold box: rental return shipping address", "CSU Bookstore\nATTN: RENTAL RETURNS\n8035 Campus Delivery\nFort Collins, CO 80523\n\n**MAKE SURE YOU INCLUDE YOUR STUDENT ID NUMBER ON THE OUTSIDE OF THE PACKAGE.**", 6),
      f("purchase", "After the address box", "- **IF YOU WISH TO PURCHASE YOUR RENTAL BOOK**: Reply to this email with your name and student ID number. We will charge your student account the difference between the rental price and the purchase price.", 3),
      f("details", "Section: “Important Details About Your Rented Course Materials”", "- **KEEP YOUR RENTED COURSE MATERIALS AWAY FROM LIQUIDS**: Use caution when studying around beverages. We are unable to accept returns on rental books damaged by liquids. We will refund rental pricing and charge the purchase price of the book in this situation.\n- **YES! YOU CAN WRITE/HIGHLIGHT IN YOUR RENTAL BOOK**: You can write notes in the margin and highlight passages in your rental book.", 6),
      ...footerFields(THANKS_SHOPPING_EXCLAIM, "You are receiving this email because you rented a textbook from the CSU Bookstore in our store or through our website.")
    ],
    body: (form) => [
      intro(form),
      callout("info", { html: valueText("<<<RENTALNOTICEBOOKS>>><<<RENTALNOTICE-NOFEES>>>", 15) }),
      alertCallout(form),
      textSection("How to RETURN Your Rented Books", form.howToReturn),
      callout("note", { body: form.shipAddress }),
      has(form.purchase) ? block(rich(form.purchase), 18) : "",
      textSection("Important Details About Your Rented Course Materials", form.details)
    ]
  }
];

// Default closing/delay alert wording (from the Order Confirmation email).
const DEFAULT_ALERT = {
  headline: "Processing Delay Notice",
  message: "CSU Bookstore order fulfillment is closed due to the holiday weekend. Orders received after 2 pm on Friday, September 4 will be processed when we return on Tuesday, September 8."
};

/* ---------- Page wiring ---------- */

const elements = {
  form: document.getElementById("emailForm"),
  templateType: document.getElementById("templateType"),
  templateFields: document.getElementById("templateFields"),
  includeAlert: document.getElementById("includeAlert"),
  alertFields: document.getElementById("alertFields"),
  alertHeadline: document.getElementById("alertHeadline"),
  alertMessage: document.getElementById("alertMessage"),
  alertStart: document.getElementById("alertStart"),
  alertEnd: document.getElementById("alertEnd"),
  resetButton: document.getElementById("resetButton"),
  copyButton: document.getElementById("copyButton"),
  downloadButton: document.getElementById("downloadButton"),
  selectHtmlButton: document.getElementById("selectHtmlButton"),
  formStatus: document.getElementById("formStatus"),
  templateBadge: document.getElementById("templateBadge"),
  emailPreview: document.getElementById("emailPreview"),
  htmlOutput: document.getElementById("htmlOutput")
};

function currentTemplate() {
  return EMAIL_TEMPLATES.find((template) => template.id === elements.templateType.value) || EMAIL_TEMPLATES[0];
}

function readForm(template) {
  const form = {
    includeAlert: elements.includeAlert.checked,
    alertHeadline: elements.alertHeadline.value,
    alertMessage: elements.alertMessage.value,
    alertStart: elements.alertStart.value,
    alertEnd: elements.alertEnd.value
  };
  template.fields.forEach((field) => {
    const input = document.getElementById(`field-${field.key}`);
    form[field.key] = input ? input.value : field.value;
  });
  return template.rentalTerm ? applyRentalTerm(form) : form;
}

function buildEmailHtml() {
  const template = currentTemplate();
  const form = readForm(template);
  return emailShell(template, form, template.body(form).filter(Boolean));
}

function renderTemplateFields(template) {
  elements.templateFields.replaceChildren(...template.fields.map((field) => {
    const wrap = document.createElement("div");
    wrap.className = field.half ? "col-md-6" : field.third ? "col-md-4" : "col-12";
    const label = document.createElement("label");
    label.className = "form-label";
    label.htmlFor = `field-${field.key}`;
    label.textContent = field.label;
    const input = document.createElement(field.rows > 1 ? "textarea" : "input");
    input.className = "form-control";
    input.id = `field-${field.key}`;
    if (field.rows > 1) input.rows = field.rows;
    else input.type = field.type || "text";
    input.value = field.value;
    wrap.append(label, input);
    const nodes = [];
    if (field.heading) {
      const heading = document.createElement("p");
      heading.className = "col-12 fw-bold mb-0";
      heading.textContent = field.heading;
      nodes.push(heading);
    }
    nodes.push(wrap);
    if (field.note) {
      const note = document.createElement("p");
      note.className = "col-12 form-text mt-1";
      note.textContent = field.note;
      nodes.push(note);
    }
    return nodes;
  }).flat());
}

function populateTemplateSelect() {
  elements.templateType.replaceChildren(...EMAIL_TEMPLATES.map((template) => {
    const option = document.createElement("option");
    option.value = template.id;
    option.textContent = template.name;
    return option;
  }));
}

function loadTemplateDefaults() {
  renderTemplateFields(currentTemplate());
  elements.alertHeadline.value = DEFAULT_ALERT.headline;
  elements.alertMessage.value = DEFAULT_ALERT.message;
  elements.alertStart.value = "";
  elements.alertEnd.value = "";
  elements.includeAlert.checked = false;
  elements.alertFields.classList.add("d-none");
  updateOutput();
}

function updateOutput() {
  const html = buildEmailHtml();
  elements.htmlOutput.value = html;
  // Preview only: show CMS codes as readable text. The copied HTML is unchanged.
  elements.emailPreview.srcdoc = html.replace(/<<<([A-Za-z0-9_-]+)>>>/g,
    '<span style="background:#fff3bf; color:#6b5300; font-family:monospace; font-size:12px;">&lt;&lt;&lt;$1&gt;&gt;&gt;</span>');
  elements.templateBadge.textContent = currentTemplate().name;
}

async function copyHtml() {
  updateOutput();
  try {
    await navigator.clipboard.writeText(elements.htmlOutput.value);
    showStatus("Generated HTML copied to clipboard.");
  } catch (error) {
    elements.htmlOutput.focus();
    elements.htmlOutput.select();
    showStatus("Copy is blocked by the browser. The HTML has been selected so you can copy it manually.");
  }
}

function downloadHtml() {
  updateOutput();
  const blob = new Blob([elements.htmlOutput.value], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${currentTemplate().id}.html`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  showStatus("HTML file downloaded.");
}

function showStatus(message) {
  elements.formStatus.textContent = message;
  window.clearTimeout(showStatus.timer);
  showStatus.timer = window.setTimeout(() => {
    elements.formStatus.textContent = "";
  }, 3500);
}

function bindEvents() {
  elements.templateType.addEventListener("change", loadTemplateDefaults);
  elements.includeAlert.addEventListener("change", () => {
    elements.alertFields.classList.toggle("d-none", !elements.includeAlert.checked);
    updateOutput();
  });
  elements.resetButton.addEventListener("click", loadTemplateDefaults);
  elements.copyButton.addEventListener("click", copyHtml);
  elements.downloadButton.addEventListener("click", downloadHtml);
  elements.selectHtmlButton.addEventListener("click", () => {
    elements.htmlOutput.focus();
    elements.htmlOutput.select();
  });
  elements.form.addEventListener("input", updateOutput);
  elements.form.addEventListener("change", updateOutput);
  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    updateOutput();
  });
}

populateTemplateSelect();
bindEvents();
loadTemplateDefaults();
