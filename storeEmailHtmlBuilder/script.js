/*
 * Store Email HTML Builder
 *
 * Every email shares ONE layout (emailShell) and ONE set of building blocks
 * (headline, section, callout, details, itemGroup, totals). Templates only
 * supply wording and choose which blocks to use, so all emails keep the same
 * format. To add an email, copy a template below and change its content;
 * do not add new styling inside a template.
 *
 * Email-client notes (why the markup looks old-fashioned):
 * - Layout is tables only, with inline styles, so Gmail, Outlook and Apple Mail
 *   render it the same way even when <style> is stripped.
 * - Outlook for Windows ignores max-width, so the 600px column is wrapped in an
 *   Outlook-only fixed-width table (<!--[if mso]>).
 * - Spacing uses table-cell padding, not <div> heights, which Outlook ignores.
 * - The font is set on every text cell because Outlook does not inherit it.
 * - <<<TOKENS>>> are filled in by the CMS and are never HTML-escaped.
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
  line: "#d9dfd7"
};

const FONT = "font-family:Arial, Helvetica, sans-serif;";

// Callout colors. Every box in every email uses one of these.
const TONES = {
  info: { accent: BRAND.green, background: "#f1f5f1", border: "#d9dfd7" },
  note: { accent: BRAND.gold, background: "#faf7e8", border: "#e4ddb1" },
  alert: { accent: "#d9782d", background: "#fff4e8", border: "#efc6a1" }
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

// Blank line = new paragraph, single line break = <br>.
function paragraphs(value = "", style = "") {
  const parts = String(value).trim().split(/\n\s*\n/).filter((part) => part.trim());
  return parts
    .map((part, index) => {
      const margin = index === parts.length - 1 ? "0" : "0 0 12px 0";
      return `<p style="margin:${margin}; ${FONT} font-size:16px; line-height:24px; color:${BRAND.text}; ${style}">${safeText(part.trim()).replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");
}

/* ---------- Building blocks (the only place email styling lives) ---------- */

// One full-width row of the email body, with consistent top spacing.
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
                <td style="padding:24px 0 0 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                    <tr><td height="1" style="height:1px; font-size:1px; line-height:1px; background-color:${BRAND.line};" bgcolor="${BRAND.line}">&nbsp;</td></tr>
                  </table>
                </td>
              </tr>`;
}

function heading(text, size = 20) {
  const lineHeight = Math.round(size * 1.3);
  return `<h3 style="margin:0; ${FONT} font-size:${size}px; line-height:${lineHeight}px; color:${BRAND.darkGreen}; font-weight:bold; mso-line-height-rule:exactly;">${safeText(text)}</h3>`;
}

function smallLabel(text) {
  return `<p style="margin:0 0 6px 0; ${FONT} font-size:12px; line-height:18px; letter-spacing:.6px; text-transform:uppercase; color:${BRAND.label}; font-weight:bold;">${safeText(text)}</p>`;
}

function valueText(html, size = 16) {
  return `<p style="margin:0; ${FONT} font-size:${size}px; line-height:${Math.round(size * 1.5)}px; color:${BRAND.ink};">${html}</p>`;
}

function smallText(html, extra = "") {
  return `<p style="margin:0; ${FONT} font-size:14px; line-height:21px; color:${BRAND.muted}; ${extra}">${html}</p>`;
}

function link(href, text) {
  return `<a href="${href}" style="color:${BRAND.green}; text-decoration:underline;">${text}</a>`;
}

// Top of the body: the big headline and the opening message.
function headline(title, message) {
  return block(`
                  <h2 style="margin:0; ${FONT} font-size:28px; line-height:34px; color:${BRAND.darkGreen}; font-weight:bold; mso-line-height-rule:exactly;">${safeText(title)}</h2>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                    <tr><td style="padding:14px 0 0 0;">${paragraphs(message)}</td></tr>
                  </table>`, 0);
}

// A divider, a heading, then content. Used for every titled section.
function section(title, contentHtml) {
  return `${divider()}${block(`
                  ${heading(title)}
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                    <tr><td style="padding:12px 0 0 0;">${contentHtml}</td></tr>
                  </table>`)}`;
}

// A colored box with a left accent bar.
function callout(contentHtml, tone = "info", paddingTop = 24) {
  const t = TONES[tone];
  return block(`
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${t.background}" style="border-collapse:collapse; background-color:${t.background};">
                    <tr>
                      <td style="padding:16px 18px; background-color:${t.background}; border:1px solid ${t.border}; border-left:6px solid ${t.accent};">
                        ${contentHtml}
                      </td>
                    </tr>
                  </table>`, paddingTop);
}

// Label/value pairs, two per row. Columns stack on phones.
function details(pairs) {
  const rows = [];
  for (let i = 0; i < pairs.length; i += 2) {
    const cell = (pair, side) => {
      if (!pair) return `<td class="stack" width="50%" valign="top" style="width:50%;">&nbsp;</td>`;
      const padding = side === "left" ? "0 12px 0 0" : "0 0 0 12px";
      return `<td class="stack" width="50%" valign="top" style="width:50%; padding:${padding};">${smallLabel(pair[0])}${pair[1]}</td>`;
    };
    rows.push(`
                    <tr>
                      ${cell(pairs[i], "left")}
                      ${cell(pairs[i + 1], "right")}
                    </tr>${i + 2 < pairs.length ? `
                    <tr><td colspan="2" height="20" style="height:20px; font-size:1px; line-height:1px;">&nbsp;</td></tr>` : ""}`);
  }
  return `
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${rows.join("")}
                  </table>`;
}

// Promo code with order notes underneath, shared by both templates.
function promoAndNotes() {
  return `${valueText("<<<PROMOCODE>>>")}
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td style="padding:16px 0 0 0;">${smallLabel("Order Notes")}${valueText("<<<CUSTORDNOTES>>>")}</td></tr></table>`;
}

// A list of items from the CMS with a right-aligned total line.
function itemGroup(title, itemsToken, totalLabel, totalToken) {
  return section(title, `
                    ${valueText(itemsToken, 15)}
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                      <tr><td align="right" style="padding:10px 0 0 0;">${smallText(`${totalLabel}: ${totalToken}`, "font-weight:bold; text-align:right;")}</td></tr>
                    </table>`);
}

function totals(rows, finalLabel, finalToken) {
  const lineRows = rows.map(([label, token]) => `
                      <tr>
                        <td style="padding:6px 10px 6px 0; ${FONT} font-size:16px; line-height:24px; color:${BRAND.text}; font-weight:bold;">${label}</td>
                        <td align="right" style="padding:6px 0; ${FONT} font-size:16px; line-height:24px; color:${BRAND.ink}; text-align:right;">${token}</td>
                      </tr>`).join("");
  return section("Order Total", `
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${lineRows}
                      <tr>
                        <td style="padding:12px 10px 0 0; ${FONT} font-size:22px; line-height:28px; color:${BRAND.darkGreen}; font-weight:bold;">${finalLabel}</td>
                        <td align="right" style="padding:12px 0 0 0; ${FONT} font-size:22px; line-height:28px; color:${BRAND.darkGreen}; font-weight:bold; text-align:right;">${finalToken}</td>
                      </tr>
                    </table>`);
}

// Optional closing/delay alert from the form.
function alertCallout(form) {
  if (!form.includeAlert) return "";
  const title = form.alertHeadline.trim() || "Closing / Delay Alert";
  const message = form.alertMessage.trim() || "Please note this temporary update before visiting or placing an order.";
  const start = prettyDateTime(form.alertStart);
  const end = prettyDateTime(form.alertEnd);
  const timing = start || end
    ? `<p style="margin:8px 0 0 0; ${FONT} font-size:13px; line-height:20px; color:#8c4b14;"><strong>Timing:</strong> ${escapeHtml(start || "Now")}${end ? ` through ${escapeHtml(end)}` : ""}</p>`
    : "";
  return callout(`
                        <p style="margin:0 0 6px 0; ${FONT} font-size:16px; line-height:22px; font-weight:bold; color:#8c4b14;">${safeText(title)}</p>
                        ${paragraphs(message, "font-size:15px; line-height:23px;")}
                        ${timing}`, "alert");
}

function needHelp(form) {
  return section("Need help?", `
                    ${paragraphs(form.footerContactMessage, "font-size:15px; line-height:23px;")}
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td style="padding:10px 0 0 0;">
                      <p style="margin:0; ${FONT} font-size:15px; line-height:23px; color:${BRAND.text};">Need to cancel your order? Use the cancellation form at ${link("https://www.bookstore.colostate.edu/cancel", "bookstore.colostate.edu/cancel")}.</p>
                    </td></tr></table>`);
}

function prettyDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

/* ---------- The one shared layout ---------- */

function emailShell(template, bodyRows) {
  const preheaderFill = "&#847;&zwnj;&nbsp;".repeat(40);
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
    body, table, td, p, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { -ms-interpolation-mode:bicubic; }
    @media only screen and (max-width:620px) {
      .email-pad { padding-left:20px !important; padding-right:20px !important; }
      .stack { display:block !important; width:100% !important; padding:0 0 16px 0 !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; width:100%; background-color:${BRAND.page};">
  <div style="display:none; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; mso-hide:all;">${safeText(template.preheader)}${preheaderFill}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.page}" style="width:100%; border-collapse:collapse; background-color:${BRAND.page};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <!--[if mso]><table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px; border-collapse:collapse;">
          <tr>
            <td class="email-pad" bgcolor="${BRAND.green}" style="padding:32px; background-color:${BRAND.green};">
              <img src="${BRAND.logoUrl}" alt="CSU Bookstore" width="200" style="display:block; width:200px; max-width:100%; height:auto; border:0; outline:none; text-decoration:none; ${FONT} font-size:20px; font-weight:bold; color:#ffffff;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                <tr><td style="padding:18px 0 0 0;">
                  ${template.eyebrow ? `<p style="margin:0 0 10px 0; ${FONT} font-size:12px; line-height:18px; letter-spacing:1px; text-transform:uppercase; color:${BRAND.gold}; font-weight:bold;">${safeText(template.eyebrow)}</p>` : ""}
                  <h1 style="margin:0; ${FONT} font-size:30px; line-height:36px; color:#ffffff; font-weight:bold; mso-line-height-rule:exactly;">${safeText(template.heroHeadline)}</h1>
                  <p style="margin:10px 0 0 0; ${FONT} font-size:15px; line-height:22px; color:#dce7dc;">${safeText(template.subhead)}</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-pad" bgcolor="${BRAND.cream}" style="padding:32px; background-color:${BRAND.cream}; border-left:1px solid ${BRAND.line}; border-right:1px solid ${BRAND.line};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${bodyRows.join("")}
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-pad" bgcolor="${BRAND.green}" style="padding:24px 32px; background-color:${BRAND.green};">
              <p style="margin:0; ${FONT} font-size:13px; line-height:20px; color:#f2f6f3;">CSU Bookstore &bull; Colorado State University</p>
              <p style="margin:0; ${FONT} font-size:13px; line-height:20px; color:#f2f6f3;">Official store of the CSU Rams</p>
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

/* ---------- Templates: wording and which blocks to use ---------- */

const EMAIL_TEMPLATES = [
  {
    id: "order-confirmation",
    name: "Order Confirmation Email",
    title: "CSU Bookstore Order Confirmation",
    preheader: "We received your CSU Bookstore order #<<<ORDERNUM>>>. We’ll begin processing it soon and send another update before it ships or is ready for pickup.",
    eyebrow: "",
    heroHeadline: "Order <<<ORDERNUM>>> Received",
    subhead: "Thank you for your order from the CSU Bookstore.",
    fields: [
      { key: "emailHeadline", label: "Email headline", rows: 1, value: "Thank you for your order." },
      { key: "openingMessage", label: "Opening message", rows: 3, value: "We received your order and will begin processing it soon." },
      { key: "pickupNote", label: "Pickup note (green box under the opening)", rows: 2, value: "If you selected in-store pickup, please wait for a pickup notification before coming to the bookstore." },
      { key: "processingMessage", label: "“How long will my order take?” section", rows: 4, value: "Orders received before 2:00 p.m. Mountain Time are processed the same business day. Orders received after 2:00 p.m. Mountain Time are processed the next business day. Orders received after 2:00 p.m. on Fridays are processed the next business day, typically Monday." },
      { key: "footerContactMessage", label: "“Need help?” section", rows: 2, value: "Have questions about your order? Email BookstoreOrders@colostate.edu or call 970-491-0904 between 8 a.m. and 4 p.m. Mountain Time." }
    ],
    alert: {
      headline: "Processing Delay Notice",
      message: "The CSU Bookstore may have adjusted hours or processing delays. Orders will be processed as quickly as possible, and we appreciate your understanding."
    },
    requestedPickup: { supported: true, defaultOn: true },
    body(form) {
      const requestedPickup = form.includeRequestedPickup
        ? section("Pickup Details", details([
            ["Requested Pickup Date", `${valueText("<<<PICKUPDATE>>>")}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td style="padding:6px 0 0 0;">${smallText("When applicable. Pickup orders are completed by or before 3:00 p.m. on the requested date and may be ready sooner.", "font-size:12px; line-height:18px;")}</td></tr></table>`],
            ["Promo Code", promoAndNotes()]
          ]))
        : "";
      return [
        headline(form.emailHeadline, form.openingMessage),
        callout(paragraphs(form.pickupNote, `font-weight:bold; color:${BRAND.darkGreen};`), "info"),
        alertCallout(form),
        section("How long will my order take?", paragraphs(form.processingMessage)),
        section("Order Details", details([
          ["Payment Method", valueText("<<<PAYMETHOD>>>")],
          ["Fulfillment Method", valueText("<<<SHIPMETHOD>>>")],
          ["Shipping Address", valueText("<<<SHIPADDRESS>>>")],
          ["Billing Address", valueText("<<<BILLADDRESS>>>")]
        ])),
        requestedPickup,
        itemGroup("Course Materials Ordered", "<<<CRSBK-NOUPDATE>>><<<CRSBK-NOINSTR>>><<<CSBKLNITEM>>>", "Total Course Materials Ordered*", "<<<DOLLARBOOKS>>>"),
        itemGroup("Merchandise Ordered", "<<<MERLNITEM>>>", "Total Merchandise Ordered*", "<<<DOLLARMER>>>"),
        itemGroup("General Books Ordered", "<<<TRADELNITEM>>>", "Total General Books Ordered*", "<<<DOLLARTRADE>>>"),
        totals([
          ["Order Discounts Applied", "<<<ORDERDISCOUNT>>>"],
          ["Item Discounts Applied", "<<<ITEMDISCOUNT>>>"],
          ["Shipping Charges", "<<<SHIPCHARGE>>>"],
          ["Shipping Discounts Applied", "<<<SHIPDISCOUNT>>>"],
          ["Subtotal", "<<<SUBTOTAL>>>"],
          ["Tax**", "<<<TAX>>>"]
        ], "Total", "<<<GRANDTOTAL>>>"),
        callout(`
                        ${smallText("<strong>*</strong> Your final total may change after processing due to textbook availability, shipping adjustments, or applicable sales tax. Your final total will appear on the receipt included with your shipment and/or your pickup or shipping confirmation email.", "font-size:12px; line-height:19px;")}
                        ${smallText("<strong>**</strong> Sales tax is calculated when your order is processed. The CSU Bookstore collects applicable sales tax on in-store pickup orders and on orders shipped to destinations where sales tax is required by law.", "font-size:12px; line-height:19px; margin-top:10px;")}
                        ${smallText(`<strong>Purchasing tax exempt?</strong> Please send a copy of your tax exemption certificate to ${link("mailto:bookstoreorders@colostate.edu", "bookstoreorders@colostate.edu")}.`, "font-size:12px; line-height:19px; margin-top:10px;")}`, "note"),
        needHelp(form)
      ];
    }
  },
  {
    id: "pickup-confirmation",
    name: "Order Pick Up Email",
    title: "CSU Bookstore Pickup Confirmation",
    preheader: "Order <<<ORDERNUM>>> is ready to pick up at the CSU Bookstore. Open this email for pickup details, hours, and a summary of your packed items.",
    eyebrow: "CSU Bookstore",
    heroHeadline: "Order <<<ORDERNUM>>> Is Ready for Pickup",
    subhead: "Your order is packed and waiting at the official store of the CSU Rams.",
    fields: [
      { key: "emailHeadline", label: "Email headline", rows: 1, value: "Your order is ready." },
      { key: "openingMessage", label: "Opening message", rows: 4, value: "Thank you for shopping at the CSU Bookstore. Your order is now ready to pick up at the CSU Bookstore. Please bring this email, either on your phone or printed, along with a photo ID." },
      { key: "pickupMessage", label: "“Where and when can I pick up my order?” section", rows: 3, value: "You can pick up your order from the Order Pickup Counter, located on the lower level of the CSU Bookstore. Pickup hours are Monday through Friday from 8 a.m. to 5 p.m." },
      { key: "pickupDeadline", label: "Pickup deadline (gold box, bold line)", rows: 1, value: "Please pick up your order within 21 days." },
      { key: "pickupDeadlineDetail", label: "Pickup deadline (gold box, small print)", rows: 2, value: "Orders not picked up within 21 days will be refunded and restocked." },
      { key: "packedOrderNote", label: "Packed order note (green box after order details)", rows: 3, value: "This email is for an in-store pickup order. If any items are not included in this packed order, they will be noted below and handled separately." },
      { key: "footerContactMessage", label: "“Need help?” section", rows: 2, value: "Need help with pickup? Email BookstoreOrders@colostate.edu or call 970-491-0904 between 8 a.m. and 4 p.m. Mountain Time." }
    ],
    alert: {
      headline: "Pickup Hours Alert",
      message: "The CSU Bookstore may have holiday closures or adjusted pickup hours. Please review current store hours before coming to campus."
    },
    requestedPickup: { supported: false, defaultOn: false },
    body(form) {
      return [
        headline(form.emailHeadline, form.openingMessage),
        callout(`
                        <p style="margin:0 0 6px 0; ${FONT} font-size:16px; line-height:24px; font-weight:bold; color:${BRAND.darkGreen};">Pickup location</p>
                        ${smallText("Order Pickup Counter, lower level of the CSU Bookstore.")}`, "info"),
        alertCallout(form),
        section("Where and when can I pick up my order?", paragraphs(form.pickupMessage)),
        callout(`
                        <p style="margin:0 0 6px 0; ${FONT} font-size:16px; line-height:24px; font-weight:bold; color:${BRAND.darkGreen};">${safeText(form.pickupDeadline)}</p>
                        ${smallText(safeText(form.pickupDeadlineDetail))}`, "note", 18),
        callout(`
                        <p style="margin:0 0 8px 0; ${FONT} font-size:18px; line-height:24px; font-weight:bold; color:${BRAND.darkGreen};">Can someone else pick up my order?</p>
                        <p style="margin:0; ${FONT} font-size:15px; line-height:23px; color:${BRAND.text};">Yes. Email ${link("mailto:bookstoreorders@colostate.edu", "BookstoreOrders@colostate.edu")} with the name of the person picking up your order so we can make a note on our end.</p>`, "note", 18),
        section("Order Details", details([
          ["Payment Method", valueText("<<<PAYMETHOD>>>")],
          ["Fulfillment Method", valueText("<<<SHIPMETHOD>>>")],
          ["Pickup Location", valueText("Pick up at the CSU Bookstore")],
          ["Billing Address", valueText("<<<BILLADDRESS>>>")],
          ["Date Order Packed", valueText("<<<DATEPACKSHIP>>>")],
          ["Promo Code", promoAndNotes()]
        ])),
        callout(paragraphs(form.packedOrderNote, "font-size:15px; line-height:23px;"), "info"),
        itemGroup("Course Materials Packed", "<<<CRSBK-NOUPDATE>>><<<CRSBK-NOINSTR>>><<<CSBKLNITEM>>>", "Total Course Materials Charged to <<<PAYMETHOD>>>", "<<<DOLLARBOOKS>>>"),
        itemGroup("Merchandise Packed", "<<<MERLNITEM>>>", "Total Merchandise Charged to <<<PAYMETHOD>>>", "<<<DOLLARMER>>>"),
        itemGroup("General Books Packed", "<<<TRADELNITEM>>>", "Total General Books Charged to <<<PAYMETHOD>>>", "<<<DOLLARTRADE>>>"),
        section("Items Not Packed", `
                    ${valueText("<<<NOTPACKED>>>", 15)}
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td style="padding:10px 0 0 0;">
                      ${smallText("The item or items listed above were not packed in this portion of your order. <strong>Your <<<PAYMETHOD>>> was not charged for items that were not packed.</strong>")}
                    </td></tr></table>`),
        totals([
          ["Item Discounts Applied", "<<<ITEMDISCOUNT>>>"],
          ["Order Discounts Applied", "<<<ORDERDISCOUNT>>>"],
          ["Subtotal", "<<<SUBTOTAL>>>"],
          ["Tax", "<<<TAX>>>"]
        ], "Total Charged to <<<PAYMETHOD>>>", "<<<GRANDTOTAL>>>"),
        needHelp(form)
      ];
    }
  }
];

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
  includeRequestedPickup: document.getElementById("includeRequestedPickup"),
  requestedPickupBlockControl: document.getElementById("requestedPickupBlockControl"),
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
    alertEnd: elements.alertEnd.value,
    includeRequestedPickup: template.requestedPickup.supported && elements.includeRequestedPickup.checked
  };
  template.fields.forEach((field) => {
    const input = document.getElementById(`field-${field.key}`);
    form[field.key] = input ? input.value : field.value;
  });
  return form;
}

function buildEmailHtml() {
  const template = currentTemplate();
  const rows = template.body(readForm(template)).filter(Boolean);
  return emailShell(template, rows);
}

function renderTemplateFields(template) {
  elements.templateFields.replaceChildren(...template.fields.map((field) => {
    const wrap = document.createElement("div");
    wrap.className = "col-12";
    const label = document.createElement("label");
    label.className = "form-label";
    label.htmlFor = `field-${field.key}`;
    label.textContent = field.label;
    const input = document.createElement(field.rows > 1 ? "textarea" : "input");
    input.className = "form-control";
    input.id = `field-${field.key}`;
    if (field.rows > 1) input.rows = field.rows;
    else input.type = "text";
    input.value = field.value;
    wrap.append(label, input);
    return wrap;
  }));
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
  const template = currentTemplate();
  renderTemplateFields(template);
  elements.alertHeadline.value = template.alert.headline;
  elements.alertMessage.value = template.alert.message;
  elements.alertStart.value = "";
  elements.alertEnd.value = "";
  elements.includeAlert.checked = false;
  elements.alertFields.classList.add("d-none");
  elements.includeRequestedPickup.checked = template.requestedPickup.defaultOn;
  elements.requestedPickupBlockControl.classList.toggle("d-none", !template.requestedPickup.supported);
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
