const EMAIL_TEMPLATES = [
  {
    id: "order-confirmation",
    name: "Order Confirmation Email",
    title: "CSU Bookstore Order Confirmation",
    preheader: "We received your CSU Bookstore order #<<<ORDERNUM>>>. We’ll begin processing it soon and send another update before it ships or is ready for pickup.",
    eyebrow: "",
    subhead: "Thank you for your order from the CSU Bookstore.",
    heroHeadline: "Order <<<ORDERNUM>>> Received",
    defaults: {
      emailHeadline: "Thank you for your order.",
      openingMessage: "We received your order and will begin processing it soon.",
      standardShippingMessage: "Orders received before 2:00 p.m. Mountain Time are processed the same business day. Orders received after 2:00 p.m. Mountain Time are processed the next business day. Orders received after 2:00 p.m. on Fridays are processed the next business day, typically Monday.",
      pickupMessage: "If you selected in-store pickup, please wait for a pickup notification before coming to the bookstore.",
      footerContactMessage: "Have questions about your order? Email BookstoreOrders@colostate.edu or call 970-491-0904 between 8 a.m. and 4 p.m. Mountain Time."
    },
    defaultAlert: {
      headline: "Processing Delay Notice",
      message: "The CSU Bookstore may have adjusted hours or processing delays. Orders will be processed as quickly as possible, and we appreciate your understanding."
    },
    includeRequestedPickupDefault: true,
    supportsRequestedPickup: true,
    sections: "confirmation"
  },
  {
    id: "pickup-confirmation",
    name: "Order Pick Up Email",
    title: "CSU Bookstore Pickup Confirmation",
    preheader: "Order <<<ORDERNUM>>> is ready to pick up at the CSU Bookstore. Open this email for pickup details, hours, and a summary of your packed items.",
    eyebrow: "CSU Bookstore",
    subhead: "Your order is packed and waiting at the official store of the CSU Rams.",
    heroHeadline: "Order <<<ORDERNUM>>> Is Ready for Pickup",
    defaults: {
      emailHeadline: "Your order is ready.",
      openingMessage: "Thank you for shopping at the CSU Bookstore. Your order is now ready to pick up at the CSU Bookstore. Please bring this email, either on your phone or printed, along with a photo ID.",
      standardShippingMessage: "This email is for an in-store pickup order. If any items are not included in this packed order, they will be noted below and handled separately.",
      pickupMessage: "You can pick up your order from the Order Pickup Counter, located on the lower level of the CSU Bookstore. Pickup hours are Monday through Friday from 8 a.m. to 5 p.m.",
      footerContactMessage: "Need help with pickup? Email BookstoreOrders@colostate.edu or call 970-491-0904 between 8 a.m. and 4 p.m. Mountain Time."
    },
    defaultAlert: {
      headline: "Pickup Hours Alert",
      message: "The CSU Bookstore may have holiday closures or adjusted pickup hours. Please review current store hours before coming to campus."
    },
    includeRequestedPickupDefault: false,
    supportsRequestedPickup: false,
    sections: "pickup"
  }
];

const BRAND = {
  logoUrl: "https://www.bookstore.colostate.edu/SiteImages/109-SchoolImages/109-EmailImages/109-Bookstore-WhHoPNGTran200x60@2x.png",
  green: "#1e4d2b",
  gold: "#c8c372",
  cream: "#fcfbf7",
  page: "#e6ebe6",
  ink: "#1d2722",
  muted: "#5a655f",
  line: "#d9dfd7"
};

const elements = {
  form: document.getElementById("emailForm"),
  templateType: document.getElementById("templateType"),
  emailHeadline: document.getElementById("emailHeadline"),
  openingMessage: document.getElementById("openingMessage"),
  standardShippingMessage: document.getElementById("standardShippingMessage"),
  pickupMessage: document.getElementById("pickupMessage"),
  footerContactMessage: document.getElementById("footerContactMessage"),
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

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function richText(value = "") {
  return escapeHtml(value)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\n/g, "<br>"))
    .filter(Boolean)
    .join('<div style="height:10px; line-height:10px;">&nbsp;</div>');
}

function prettyDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function spacer(height) {
  return `<div style="height:${height}px; line-height:${height}px;">&nbsp;</div>`;
}

function sectionRule() {
  return `${spacer(22)}<div style="border-top:1px solid ${BRAND.line};">&nbsp;</div>`;
}

function twoColumn(leftLabel, leftValue, rightLabel, rightValue) {
  return `
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-spacing:0; border-collapse:collapse;">
                  <tr>
                    <td width="50%" valign="top" style="padding-right:12px;">
                      <div style="font-size:12px; line-height:18px; letter-spacing:.6px; text-transform:uppercase; color:#617068; font-weight:bold;">${leftLabel}</div>
                      ${spacer(6)}
                      <div style="font-size:17px; line-height:25px; color:${BRAND.ink};">${leftValue}</div>
                    </td>
                    <td width="50%" valign="top" style="padding-left:12px;">
                      <div style="font-size:12px; line-height:18px; letter-spacing:.6px; text-transform:uppercase; color:#617068; font-weight:bold;">${rightLabel}</div>
                      ${spacer(6)}
                      <div style="font-size:17px; line-height:25px; color:${BRAND.ink};">${rightValue}</div>
                    </td>
                  </tr>
                </table>`;
}

function infoBox(content, accent = BRAND.green, background = "#f1f5f1", border = "transparent") {
  return `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${background}" style="border-spacing:0; border-collapse:collapse; background-color:${background}; border:1px solid ${border}; border-left:6px solid ${accent};">
                <tr>
                  <td style="padding:16px 18px;">
                    ${content}
                  </td>
                </tr>
              </table>`;
}

function alertBlock() {
  if (!elements.includeAlert.checked) return "";

  const headline = elements.alertHeadline.value.trim() || "Closing / Delay Alert";
  const message = elements.alertMessage.value.trim() || "Please note this temporary update before visiting or placing an order.";
  const start = prettyDateTime(elements.alertStart.value);
  const end = prettyDateTime(elements.alertEnd.value);
  const dateLine = start || end
    ? `${spacer(8)}<div style="font-size:13px; line-height:20px; color:#8c4b14;"><strong>Timing:</strong> ${escapeHtml(start || "Now")}${end ? ` through ${escapeHtml(end)}` : ""}</div>`
    : "";

  return `
              ${infoBox(`
                    <div style="font-size:16px; line-height:22px; font-weight:bold; color:#8c4b14;">${escapeHtml(headline)}</div>
                    ${spacer(6)}
                    <div style="font-size:15px; line-height:23px; color:#2f3a34;">${richText(message)}</div>
                    ${dateLine}
              `, "#d9782d", "#fff4e8", "#efc6a1")}
              ${spacer(18)}`;
}

function requestedPickupSection() {
  if (!elements.includeRequestedPickup.checked) return "";
  return `
              ${sectionRule()}
              <div style="padding-top:22px;">
                ${twoColumn(
                  "Requested Pickup Date",
                  `<<<PICKUPDATE>>>${spacer(6)}<div style="font-size:12px; line-height:18px; color:${BRAND.muted};">When applicable. Pickup orders are completed by or before 3:00 p.m. on the requested date and may be ready sooner.</div>`,
                  "Promo Code",
                  `<<<PROMOCODE>>>${spacer(16)}<div style="font-size:12px; line-height:18px; letter-spacing:.6px; text-transform:uppercase; color:#617068; font-weight:bold;">Order Notes</div>${spacer(6)}<div style="font-size:16px; line-height:24px; color:${BRAND.ink};"><<<CUSTORDNOTES>>></div>`
                )}
              </div>`;
}

function itemSections(mode) {
  const packedWord = mode === "pickup" ? "Packed" : "Ordered";
  const chargedText = mode === "pickup" ? "Charged to <<<PAYMETHOD>>>" : "Ordered*";
  const notPacked = mode === "pickup" ? `
              ${sectionRule()}
              <div style="padding-top:24px;">
                <h3 style="font-size:20px; line-height:26px; color:#163c21; font-weight:bold; margin:0;">Items Not Packed</h3>
                ${spacer(10)}
                <div style="font-size:15px; line-height:24px; color:#2f3a34;"><<<NOTPACKED>>></div>
                ${spacer(10)}
                <div style="font-size:14px; line-height:21px; color:${BRAND.muted};">The item or items listed above were not packed in this portion of your order. <strong>Your <<<PAYMETHOD>>> was not charged for items that were not packed.</strong></div>
              </div>` : "";

  return `
              ${sectionRule()}
              <div style="padding-top:24px;">
                <h3 style="font-size:20px; line-height:26px; color:#163c21; font-weight:bold; margin:0;">Course Materials ${packedWord}</h3>
                ${spacer(10)}
                <div style="font-size:15px; line-height:24px; color:#2f3a34;"><<<CRSBK-NOUPDATE>>><<<CRSBK-NOINSTR>>><<<CSBKLNITEM>>></div>
                ${spacer(10)}
                <div style="font-size:14px; line-height:21px; color:${BRAND.muted}; font-weight:bold; text-align:right;">Total Course Materials ${chargedText}: <<<DOLLARBOOKS>>></div>
              </div>
              ${sectionRule()}
              <div style="padding-top:24px;">
                <h3 style="font-size:20px; line-height:26px; color:#163c21; font-weight:bold; margin:0;">Merchandise ${packedWord}</h3>
                ${spacer(10)}
                <div style="font-size:15px; line-height:24px; color:#2f3a34;"><<<MERLNITEM>>></div>
                ${spacer(10)}
                <div style="font-size:14px; line-height:21px; color:${BRAND.muted}; font-weight:bold; text-align:right;">Total Merchandise ${chargedText}: <<<DOLLARMER>>></div>
              </div>
              ${sectionRule()}
              <div style="padding-top:24px;">
                <h3 style="font-size:20px; line-height:26px; color:#163c21; font-weight:bold; margin:0;">General Books ${packedWord}</h3>
                ${spacer(10)}
                <div style="font-size:15px; line-height:24px; color:#2f3a34;"><<<TRADELNITEM>>></div>
                ${spacer(10)}
                <div style="font-size:14px; line-height:21px; color:${BRAND.muted}; font-weight:bold; text-align:right;">Total General Books ${chargedText}: <<<DOLLARTRADE>>></div>
              </div>
              ${notPacked}`;
}

function totalsSection(mode) {
  const isPickup = mode === "pickup";
  const rows = isPickup
    ? [
        ["Item Discounts Applied", "<<<ITEMDISCOUNT>>>"],
        ["Order Discounts Applied", "<<<ORDERDISCOUNT>>>"],
        ["Subtotal", "<<<SUBTOTAL>>>"],
        ["Tax", "<<<TAX>>>"]
      ]
    : [
        ["Order Discounts Applied", "<<<ORDERDISCOUNT>>>"],
        ["Item Discounts Applied", "<<<ITEMDISCOUNT>>>"],
        ["Shipping Charges", "<<<SHIPCHARGE>>>"],
        ["Shipping Discounts Applied", "<<<SHIPDISCOUNT>>>"],
        ["Subtotal", "<<<SUBTOTAL>>>"],
        ["Tax**", "<<<TAX>>>"]
      ];

  return `
              ${sectionRule()}
              <div style="padding-top:24px;">
                <h3 style="font-size:20px; line-height:26px; color:#163c21; font-weight:bold; margin:0;">Order Total</h3>
                ${spacer(14)}
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-spacing:0; border-collapse:collapse;">
                  ${rows.map(([label, value]) => `
                  <tr>
                    <td style="padding:6px 10px 6px 0; font-size:16px; line-height:24px; color:#2f3a34; font-weight:bold;">${label}</td>
                    <td style="padding:6px 0; font-size:16px; line-height:24px; color:${BRAND.ink}; text-align:right;">${value}</td>
                  </tr>`).join("")}
                  <tr>
                    <td style="padding:12px 10px 0 0; font-size:24px; line-height:30px; color:#163c21; font-weight:bold;">${isPickup ? "Total Charged to <<<PAYMETHOD>>>" : "Total"}</td>
                    <td style="padding:12px 0 0; font-size:24px; line-height:30px; color:#163c21; font-weight:bold; text-align:right;"><<<GRANDTOTAL>>></td>
                  </tr>
                </table>
              </div>`;
}

function confirmationSpecificSections() {
  return `
              <div style="padding-top:28px;">
                <h3 style="font-size:20px; line-height:26px; color:#163c21; font-weight:bold; margin:0;">How long will my order take?</h3>
                ${spacer(12)}
                <div style="font-size:16px; line-height:24px; color:#2f3a34;">${richText(elements.standardShippingMessage.value)}</div>
              </div>
              <div style="padding-top:28px;">
                ${twoColumn("Payment Method", "<<<PAYMETHOD>>>", "Fulfillment Method", "<<<SHIPMETHOD>>>")}
              </div>
              ${sectionRule()}
              <div style="padding-top:22px;">
                ${twoColumn("Shipping Address", "<<<SHIPADDRESS>>>", "Billing Address", "<<<BILLADDRESS>>>")}
              </div>
              ${requestedPickupSection()}`;
}

function pickupSpecificSections() {
  return `
              <div style="padding-top:24px;">
                <h3 style="font-size:20px; line-height:26px; color:#163c21; font-weight:bold; margin:0;">Where and when can I pick up my order?</h3>
                ${spacer(12)}
                <div style="font-size:16px; line-height:24px; color:#2f3a34;">${richText(elements.pickupMessage.value)}</div>
              </div>
              ${spacer(18)}
              ${infoBox(`
                    <div style="font-size:16px; line-height:24px; color:#163c21; font-weight:bold;">Please pick up your order within 21 days.</div>
                    ${spacer(6)}
                    <div style="font-size:14px; line-height:21px; color:${BRAND.muted};">Orders not picked up within 21 days will be refunded and restocked.</div>
              `, BRAND.gold, "#f5f7e8", "#dde3b1")}
              ${spacer(24)}
              ${infoBox(`
                    <div style="font-size:20px; line-height:26px; font-weight:bold; color:#163c21;">Can someone else pick up my order?</div>
                    ${spacer(8)}
                    <div style="font-size:15px; line-height:23px; color:#2f3a34;">Yes. Email <a href="mailto:bookstoreorders@colostate.edu" style="color:${BRAND.green};">BookstoreOrders@colostate.edu</a> with the name of the person picking up your order so we can make a note on our end.</div>
              `, BRAND.gold, "#faf7e8", "#e4ddb1")}
              ${sectionRule()}
              <div style="padding-top:24px;">
                ${twoColumn("Payment Method", "<<<PAYMETHOD>>>", "Fulfillment Method", "<<<SHIPMETHOD>>>")}
              </div>
              ${sectionRule()}
              <div style="padding-top:22px;">
                ${twoColumn("Pickup Location", "Pick up at the CSU Bookstore", "Billing Address", "<<<BILLADDRESS>>>")}
              </div>
              ${sectionRule()}
              <div style="padding-top:22px;">
                ${twoColumn(
                  "Date Order Packed",
                  "<<<DATEPACKSHIP>>>",
                  "Promo Code",
                  `<<<PROMOCODE>>>${spacer(16)}<div style="font-size:12px; line-height:18px; letter-spacing:.6px; text-transform:uppercase; color:#617068; font-weight:bold;">Order Notes</div>${spacer(6)}<div style="font-size:16px; line-height:24px; color:${BRAND.ink};"><<<CUSTORDNOTES>>></div>`
                )}
              </div>
              ${spacer(18)}
              ${infoBox(`<div style="font-size:15px; line-height:23px; color:#2f3a34;">${richText(elements.standardShippingMessage.value)}</div>`, BRAND.green, "#f1f5f1", "#d9dfd7")}`;
}

function taxNoteSection(mode) {
  if (mode === "pickup") return "";
  return `
              ${spacer(20)}
              ${infoBox(`
                    <div style="font-size:12px; line-height:19px; color:${BRAND.muted};"><strong>*</strong> Your final total may change after processing due to textbook availability, shipping adjustments, or applicable sales tax. Your final total will appear on the receipt included with your shipment and/or your pickup or shipping confirmation email.</div>
                    ${spacer(10)}
                    <div style="font-size:12px; line-height:19px; color:${BRAND.muted};"><strong>**</strong> Sales tax is calculated when your order is processed. The CSU Bookstore collects applicable sales tax on in-store pickup orders and on orders shipped to destinations where sales tax is required by law.</div>
                    ${spacer(10)}
                    <div style="font-size:12px; line-height:19px; color:${BRAND.muted};"><strong>Purchasing tax exempt?</strong> Please send a copy of your tax exemption certificate to <a href="mailto:bookstoreorders@colostate.edu" style="color:${BRAND.green};">bookstoreorders@colostate.edu</a>.</div>
              `, BRAND.gold, "#faf7e8", "#e4ddb1")}`;
}

function buildEmailHtml() {
  const template = currentTemplate();
  const mode = template.sections === "pickup" ? "pickup" : "confirmation";
  const headline = elements.emailHeadline.value.trim();
  const opening = elements.openingMessage.value.trim();
  const pickup = elements.pickupMessage.value.trim();
  const footer = elements.footerContactMessage.value.trim();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escapeHtml(template.title)}</title>
</head>
<body style="margin:0; padding:0; width:100%; min-width:100%; background-color:${BRAND.page}; font-family:Arial, Helvetica, sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
  <div style="display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; overflow:hidden; mso-hide:all;">${escapeHtml(template.preheader)}</div>

  <table role="presentation" width="100%" bgcolor="${BRAND.page}" cellpadding="0" cellspacing="0" style="width:100%; border-spacing:0; border-collapse:collapse; background-color:${BRAND.page};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%; max-width:600px; border-spacing:0; border-collapse:collapse;">
          <tr>
            <td bgcolor="${BRAND.green}" style="padding:32px; background-color:${BRAND.green};">
              <img src="${BRAND.logoUrl}" alt="CSU Bookstore" width="200" style="display:block; width:200px; max-width:100%; height:auto; border:0; line-height:100%;">
              ${spacer(18)}
              ${template.eyebrow ? `<div style="font-size:12px; line-height:18px; letter-spacing:1px; text-transform:uppercase; color:${BRAND.gold}; font-weight:bold;">${escapeHtml(template.eyebrow)}</div>${spacer(10)}` : ""}
              <h1 style="font-size:32px; line-height:38px; color:#ffffff; font-weight:bold; margin:0;">${escapeHtml(template.heroHeadline)}</h1>
              ${spacer(10)}
              <div style="font-size:15px; line-height:22px; color:#dce7dc;">${escapeHtml(template.subhead)}</div>
            </td>
          </tr>

          <tr>
            <td bgcolor="${BRAND.cream}" style="padding:32px; background-color:${BRAND.cream}; border:1px solid ${BRAND.line};">
              <h2 style="font-size:28px; line-height:34px; color:#163c21; font-weight:bold; margin:0;">${escapeHtml(headline)}</h2>
              ${spacer(14)}
              <div style="font-size:16px; line-height:24px; color:#2f3a34;">${richText(opening)}</div>
              ${spacer(18)}
              ${mode === "confirmation"
                ? infoBox(`<div style="font-size:16px; line-height:24px; font-weight:bold; color:#163c21;">${richText(pickup)}</div>`, BRAND.green, "#f1f5f1", "#d9dfd7")
                : infoBox(`<div style="font-size:16px; line-height:24px; font-weight:bold; color:#163c21;">Pickup location</div>${spacer(6)}<div style="font-size:14px; line-height:21px; color:${BRAND.muted};">Order Pickup Counter, lower level of the CSU Bookstore.</div>`, BRAND.green, "#f1f5f1", "#d9dfd7")
              }
              ${spacer(18)}
              ${alertBlock()}
              ${mode === "confirmation" ? confirmationSpecificSections() : pickupSpecificSections()}
              ${itemSections(mode)}
              ${totalsSection(mode)}
              ${taxNoteSection(mode)}
              ${sectionRule()}
              <div style="padding-top:24px;">
                <h3 style="font-size:20px; line-height:26px; color:#163c21; font-weight:bold; margin:0;">Need help?</h3>
                ${spacer(10)}
                <div style="font-size:15px; line-height:23px; color:#2f3a34;">${richText(footer)}</div>
                ${spacer(10)}
                <div style="font-size:15px; line-height:23px; color:#2f3a34;">Need to cancel your order? Use the cancellation form at <a href="https://www.bookstore.colostate.edu/cancel" style="color:${BRAND.green};">bookstore.colostate.edu/cancel</a>.</div>
              </div>
            </td>
          </tr>

          <tr>
            <td bgcolor="${BRAND.green}" style="padding:24px 32px; background-color:${BRAND.green};">
              <div style="font-size:13px; line-height:20px; color:#f2f6f3;">CSU Bookstore &bull; Colorado State University</div>
              <div style="font-size:13px; line-height:20px; color:#f2f6f3;">Official store of the CSU Rams</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function populateTemplateSelect() {
  elements.templateType.innerHTML = EMAIL_TEMPLATES
    .map((template) => `<option value="${template.id}">${template.name}</option>`)
    .join("");
}

function loadTemplateDefaults() {
  const template = currentTemplate();
  elements.emailHeadline.value = template.defaults.emailHeadline;
  elements.openingMessage.value = template.defaults.openingMessage;
  elements.standardShippingMessage.value = template.defaults.standardShippingMessage;
  elements.pickupMessage.value = template.defaults.pickupMessage;
  elements.footerContactMessage.value = template.defaults.footerContactMessage;
  elements.alertHeadline.value = template.defaultAlert.headline;
  elements.alertMessage.value = template.defaultAlert.message;
  elements.alertStart.value = "";
  elements.alertEnd.value = "";
  elements.includeAlert.checked = false;
  elements.alertFields.classList.add("d-none");
  elements.includeRequestedPickup.checked = Boolean(template.includeRequestedPickupDefault);
  elements.requestedPickupBlockControl.classList.toggle("d-none", !template.supportsRequestedPickup);
  updateOutput();
}

function updateOutput() {
  const template = currentTemplate();
  const html = buildEmailHtml();
  elements.htmlOutput.value = html;
  elements.emailPreview.srcdoc = html;
  elements.templateBadge.textContent = template.name;
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
  const template = currentTemplate();
  const blob = new Blob([elements.htmlOutput.value], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${template.id}.html`;
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
