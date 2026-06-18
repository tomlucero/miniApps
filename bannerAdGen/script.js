const DEFAULT_TEMPLATE = `// random-banner.js
// This script selects two unique promotional banners from a predefined list
// and injects them into designated containers in the HTML document.

// Each banner has desktop and mobile image versions, alt text, a URL, and an expiration date.
// Banners that have expired are excluded from selection.
// There are use cases for evergreen, seasonal, and promotional banners. Evergreen banners are always eligible,
// seasonal banners are typically time-sensitive, and promotional banners may have specific end dates.

// Usage: Include this script in an HTML document with two containers having IDs "promoTop" and "promoBottom".
// Banner sizes - Desktop: 1300x100px, Mobile: 768x150px; design at 2600x200px and 1536x300px respectively for best quality on high-DPI screens.

document.addEventListener("DOMContentLoaded", function () {
  const promos = [
  ];

  // Filter expired + disabled promos
  const today = new Date();
  const activePromos = promos.filter(p => {
    if (p.use === "disabled") return false;
    if (!p.endDate) return true;
    const end = new Date(p.endDate + "T23:59:59");
    return end >= today;
  });

  // Build weighted pool: seasonal > promotional > evergreen
  const weightedPromos = [];
  activePromos.forEach(p => {
    if (p.use === "promotional") {
      weightedPromos.push(p, p, p);
    } else if (p.use === "seasonal") {
      weightedPromos.push(p, p);
    } else {
      weightedPromos.push(p);
    }
  });

  function pickTwoRandom(list) {
    if (list.length === 0) return [null, null];
    if (list.length === 1) return [list[0], list[0]];

    const first = list[Math.floor(Math.random() * list.length)];
    let second = first;
    while (second === first) {
      second = list[Math.floor(Math.random() * list.length)];
    }
    return [first, second];
  }

  function buildBanner(promo, isTopBanner = false) {
    const loadingAttr = isTopBanner ? "" : "loading='lazy'";
    return \`
      <a href="\${promo.url}" aria-label="\${promo.alt}" data-promoName="\${promo.promoName}">
        <picture>
          <source media="(max-width: 767px)" srcset="\${promo.mobile}">
          <source media="(min-width: 768px)" srcset="\${promo.desktop}">
          <img src="\${promo.desktop}" alt="\${promo.alt}" style="width:100%;height:auto;" \${loadingAttr}>
        </picture>
      </a>\`;
  }

  const [topPromo, bottomPromo] = pickTwoRandom(weightedPromos);
  const topContainer = document.getElementById("promoTop");
  const bottomContainer = document.getElementById("promoBottom");

  if (topContainer && topPromo) {
    topContainer.innerHTML = buildBanner(topPromo, true);
  }
  if (bottomContainer && bottomPromo) {
    bottomContainer.innerHTML = buildBanner(bottomPromo, false);
  }

  document.addEventListener("click", function (e) {
    const bannerLink = e.target.closest("#promoTop a, #promoBottom a");
    if (bannerLink && window.gtag) {
      const promoName = bannerLink.getAttribute("data-promoName") || "Unknown Promo";
      const container = bannerLink.closest("#promoTop") ? "Top Banner" : "Bottom Banner";
      gtag("event", "select_promotion", {
        promotion_id: promoName.toLowerCase().replace(/\\s+/g, "_"),
        promotion_name: promoName,
        creative_name: container,
        creative_slot: container.includes("Top") ? "hero_top" : "hero_bottom",
        location_id: "homepage",
        event_category: "Homepage Banner",
        event_label: \`\${container}: \${promoName}\`,
        value: 1
      });
    }
  });
});`;

const PREVIEW_IMAGE_BASE_URL = "https://www.bookstore.colostate.edu/";

const state = {
  source: "",
  arrayStart: -1,
  arrayEnd: -1,
  banners: [],
  selectedIndex: -1,
  previewMode: "desktop"
};

const els = {
  fileInput: document.getElementById("fileInput"),
  sourceInput: document.getElementById("sourceInput"),
  parseButton: document.getElementById("parseButton"),
  loadSampleButton: document.getElementById("loadSampleButton"),
  parseStatus: document.getElementById("parseStatus"),
  bannerList: document.getElementById("bannerList"),
  bannerForm: document.getElementById("bannerForm"),
  formTitle: document.getElementById("formTitle"),
  editingIndex: document.getElementById("editingIndex"),
  promoName: document.getElementById("promoName"),
  destinationUrl: document.getElementById("destinationUrl"),
  campaignName: document.getElementById("campaignName"),
  url: document.getElementById("url"),
  desktop: document.getElementById("desktop"),
  mobile: document.getElementById("mobile"),
  alt: document.getElementById("alt"),
  use: document.getElementById("use"),
  endDate: document.getElementById("endDate"),
  note: document.getElementById("note"),
  validationErrors: document.getElementById("validationErrors"),
  saveButton: document.getElementById("saveButton"),
  resetFormButton: document.getElementById("resetFormButton"),
  newButton: document.getElementById("newButton"),
  previewFrame: document.getElementById("previewFrame"),
  previewMeta: document.getElementById("previewMeta"),
  desktopPreviewButton: document.getElementById("desktopPreviewButton"),
  mobilePreviewButton: document.getElementById("mobilePreviewButton"),
  output: document.getElementById("output"),
  copyButton: document.getElementById("copyButton"),
  downloadButton: document.getElementById("downloadButton"),
  resetAllButton: document.getElementById("resetAllButton"),
  template: document.getElementById("bannerItemTemplate")
};

function findPromosArray(source) {
  const match = source.match(/const\s+promos\s*=\s*\[/);
  if (!match) throw new Error('Could not find `const promos = [` in this file.');
  const openIndex = match.index + match[0].lastIndexOf("[");
  const closeIndex = findMatchingBracket(source, openIndex, "[", "]");
  return { start: openIndex, end: closeIndex };
}

function findMatchingBracket(text, start, openChar, closeChar) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = start; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        i += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === "/" && next === "/") {
      lineComment = true;
      i += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      blockComment = true;
      i += 1;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === openChar) depth += 1;
    if (char === closeChar) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }

  throw new Error("Could not find the end of the promos array.");
}

function splitObjects(arrayContent) {
  const objects = [];
  let objectStart = -1;
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  let leadingComment = "";

  for (let i = 0; i < arrayContent.length; i += 1) {
    const char = arrayContent[i];
    const next = arrayContent[i + 1];

    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        i += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === "/" && next === "/") {
      const lineEnd = arrayContent.indexOf("\n", i);
      const comment = arrayContent.slice(i + 2, lineEnd === -1 ? arrayContent.length : lineEnd).trim();
      if (depth === 0 && comment) leadingComment = comment;
      lineComment = true;
      i += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      blockComment = true;
      i += 1;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") {
      if (depth === 0) objectStart = i;
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0 && objectStart !== -1) {
        objects.push({ text: arrayContent.slice(objectStart, i + 1), leadingComment });
        objectStart = -1;
        leadingComment = "";
      }
    }
  }

  return objects;
}

function parseStringProperty(objectText, key) {
  const keyMatch = objectText.match(new RegExp(`${key}\\s*:\\s*(['"\`])`));
  if (!keyMatch) return "";
  const quoteChar = keyMatch[1];
  const valueStart = keyMatch.index + keyMatch[0].length;
  let value = "";
  let escaped = false;

  for (let i = valueStart; i < objectText.length; i += 1) {
    const char = objectText[i];
    if (escaped) {
      value += `\\${char}`;
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === quoteChar) return unescapeJsString(value, quoteChar);
    value += char;
  }

  return "";
}

function parseInlineComment(objectText, key) {
  const pattern = new RegExp(`${key}\\s*:\\s*(['"\`])[\\s\\S]*?\\1\\s*,?\\s*//([^\\n]*)`);
  const match = objectText.match(pattern);
  return match ? match[2].trim() : "";
}

function unescapeJsString(value, quote) {
  if (quote === "`") return value.replace(/\\`/g, "`").replace(/\\\\/g, "\\");
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, "\\");
}

function parseSource(source) {
  const range = findPromosArray(source);
  const content = source.slice(range.start + 1, range.end);
  const banners = splitObjects(content).map(({ text, leadingComment }) => {
    const inlineUseComment = parseInlineComment(text, "use");
    const note = leadingComment || inlineUseComment;
    const promoName = parseStringProperty(text, "promoName");
    const url = parseStringProperty(text, "url");
    const urlParts = splitTrackedUrl(url);
    return {
      promoName,
      destinationUrl: urlParts.destinationUrl,
      campaignName: urlParts.campaignName || makeCampaignName(promoName),
      url,
      alt: parseStringProperty(text, "alt"),
      desktop: parseStringProperty(text, "desktop"),
      mobile: parseStringProperty(text, "mobile"),
      use: parseStringProperty(text, "use") || "promotional",
      endDate: parseStringProperty(text, "endDate"),
      note
    };
  });

  return { range, banners };
}

function validateBanner(banner) {
  const errors = [];
  const required = ["promoName", "destinationUrl", "campaignName", "url", "alt", "desktop", "mobile", "use", "endDate"];
  required.forEach((field) => {
    if (!String(banner[field] || "").trim()) errors.push(`${labelFor(field)} is required.`);
  });

  if (banner.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(banner.endDate)) {
    errors.push("End date must use YYYY-MM-DD format.");
  }

  if (banner.use && !["evergreen", "seasonal", "promotional", "disabled"].includes(banner.use)) {
    errors.push("Banner type must be evergreen, seasonal, promotional, or disabled.");
  }

  ["destinationUrl", "campaignName", "desktop", "mobile"].forEach((field) => {
    const value = String(banner[field] || "");
    if (/[<>"`]/.test(value)) errors.push(`${labelFor(field)} cannot include <, >, quotes, or backticks.`);
  });

  return errors;
}

function labelFor(field) {
  return {
    promoName: "Banner name",
    destinationUrl: "Destination URL",
    campaignName: "Campaign name",
    url: "Generated CTA URL",
    alt: "Alt text",
    desktop: "Desktop image URL",
    mobile: "Mobile image URL",
    use: "Banner type",
    endDate: "End date"
  }[field] || field;
}

function getFormBanner() {
  const destinationUrl = els.destinationUrl.value.trim();
  const campaignName = els.campaignName.value.trim();
  const url = buildTrackedUrl(destinationUrl, campaignName);
  els.url.value = url;
  return {
    promoName: els.promoName.value.trim(),
    destinationUrl,
    campaignName,
    url,
    alt: els.alt.value.trim(),
    desktop: els.desktop.value.trim(),
    mobile: els.mobile.value.trim(),
    use: els.use.value,
    endDate: els.endDate.value,
    note: els.note.value.trim()
  };
}

function fillForm(banner, index = "") {
  const urlParts = splitTrackedUrl(banner.url || "");
  els.editingIndex.value = index;
  els.formTitle.textContent = index === "" ? "Add Banner" : "Edit Banner";
  els.saveButton.textContent = index === "" ? "Add Banner" : "Update Banner";
  els.promoName.value = banner.promoName || "";
  els.destinationUrl.value = banner.destinationUrl || urlParts.destinationUrl || "";
  els.campaignName.value = banner.campaignName || urlParts.campaignName || "";
  els.url.value = buildTrackedUrl(els.destinationUrl.value, els.campaignName.value);
  els.desktop.value = banner.desktop || "";
  els.mobile.value = banner.mobile || "";
  els.alt.value = banner.alt || "";
  els.use.value = banner.use || "promotional";
  els.endDate.value = banner.endDate || "";
  els.note.value = banner.note || "";
  showErrors([]);
  updatePreview(banner);
}

function showErrors(errors) {
  els.validationErrors.innerHTML = errors.map(escapeHtml).join("<br>");
  els.validationErrors.classList.toggle("visible", errors.length > 0);
}

function quote(value) {
  return JSON.stringify(String(value || ""));
}

function safeComment(value) {
  return String(value || "")
    .replace(/\*\//g, "")
    .replace(/[\r\n]+/g, " ")
    .replace(/[<>]/g, "")
    .trim();
}

function generatePromosArray(banners) {
  if (!banners.length) return "[]";
  const entries = banners.map((banner) => {
    const urlParts = splitTrackedUrl(banner.url);
    const destinationUrl = banner.destinationUrl || urlParts.destinationUrl;
    const campaignName = banner.campaignName || urlParts.campaignName || makeCampaignName(banner.promoName);
    const note = safeComment(banner.note);
    const lines = [];
    if (note) lines.push(`    // ${note}`);
    lines.push("    {");
    lines.push(`      promoName: ${quote(banner.promoName)},`);
    lines.push(`      url: ${quote(buildTrackedUrl(destinationUrl, campaignName) || banner.url)},`);
    lines.push(`      alt: ${quote(banner.alt)},`);
    lines.push(`      desktop: ${quote(banner.desktop)},`);
    lines.push(`      mobile: ${quote(banner.mobile)},`);
    lines.push(`      use: ${quote(banner.use)},`);
    lines.push(`      endDate: ${quote(banner.endDate)}`);
    lines.push("    }");
    return lines.join("\n");
  });
  return `[\n${entries.join(",\n")}\n  ]`;
}

function generateOutput() {
  const source = state.source || DEFAULT_TEMPLATE;
  let range = { start: -1, end: -1 };
  try {
    range = findPromosArray(source);
  } catch {
    return generatePromosArray(state.banners);
  }
  return source.slice(0, range.start) + generatePromosArray(state.banners) + source.slice(range.end + 1);
}

function renderList() {
  els.bannerList.innerHTML = "";
  state.banners.forEach((banner, index) => {
    const node = els.template.content.firstElementChild.cloneNode(true);
    node.classList.toggle("selected", index === state.selectedIndex);
    const select = node.querySelector(".select-banner");
    const isExpired = banner.endDate && new Date(`${banner.endDate}T23:59:59`) < new Date();
    const status = banner.use === "disabled" ? "disabled" : isExpired ? "expired" : banner.use;
    select.innerHTML = `<span class="item-title">${escapeHtml(banner.promoName || "Untitled banner")}</span><span class="item-meta">${index + 1}. ${escapeHtml(status)} · ends ${escapeHtml(banner.endDate || "no date")}</span>`;
    select.addEventListener("click", () => selectBanner(index));

    node.querySelector(".move-up").disabled = index === 0;
    node.querySelector(".move-down").disabled = index === state.banners.length - 1;
    node.querySelector(".move-up").addEventListener("click", () => moveBanner(index, -1));
    node.querySelector(".move-down").addEventListener("click", () => moveBanner(index, 1));

    const toggle = node.querySelector(".toggle-banner");
    toggle.textContent = banner.use === "disabled" ? "Enable" : "Disable";
    toggle.addEventListener("click", () => toggleBanner(index));

    node.querySelector(".delete-banner").addEventListener("click", () => deleteBanner(index));
    els.bannerList.appendChild(node);
  });
  refreshOutput();
}

function selectBanner(index) {
  state.selectedIndex = index;
  fillForm(state.banners[index], index);
  renderList();
}

function moveBanner(index, direction) {
  const nextIndex = index + direction;
  const item = state.banners.splice(index, 1)[0];
  state.banners.splice(nextIndex, 0, item);
  state.selectedIndex = nextIndex;
  renderList();
  selectBanner(nextIndex);
}

function toggleBanner(index) {
  const banner = state.banners[index];
  banner.use = banner.use === "disabled" ? "promotional" : "disabled";
  selectBanner(index);
}

function deleteBanner(index) {
  const banner = state.banners[index];
  if (!window.confirm(`Delete "${banner.promoName || "this banner"}"? This only changes the export until you save the JS file.`)) return;
  state.banners.splice(index, 1);
  state.selectedIndex = Math.min(index, state.banners.length - 1);
  if (state.selectedIndex >= 0) fillForm(state.banners[state.selectedIndex], state.selectedIndex);
  else resetForm();
  renderList();
}

function resetForm() {
  state.selectedIndex = -1;
  fillForm({ use: "promotional" }, "");
  renderList();
}

function updatePreview(banner = getFormBanner()) {
  const errors = validateBanner({ ...banner, endDate: banner.endDate || "2099-12-31" }).filter((error) => {
    return !error.includes("End date is required");
  });
  els.previewFrame.classList.toggle("desktop-preview", state.previewMode === "desktop");
  els.previewFrame.classList.toggle("mobile-preview", state.previewMode === "mobile");
  els.desktopPreviewButton.classList.toggle("active", state.previewMode === "desktop");
  els.mobilePreviewButton.classList.toggle("active", state.previewMode === "mobile");

  if (!banner.desktop && !banner.mobile) {
    els.previewFrame.innerHTML = '<div class="empty-preview">No banner selected</div>';
    els.previewMeta.textContent = "Select or create a banner.";
    return;
  }

  const image = state.previewMode === "mobile" ? banner.mobile : banner.desktop;
  const previewImage = resolvePreviewImageUrl(image);
  els.previewFrame.innerHTML = `
    <a href="${escapeAttr(banner.url || "#")}" aria-label="${escapeAttr(banner.alt || banner.promoName || "")}">
      <img src="${escapeAttr(previewImage)}" alt="${escapeAttr(banner.alt || "")}">
    </a>
  `;
  const warning = errors.length ? " · needs required fields" : "";
  els.previewMeta.textContent = `${banner.promoName || "Untitled banner"} · ${banner.use || "promotional"}${warning}`;
}

function buildTrackedUrl(destinationUrl, campaignName) {
  const destination = String(destinationUrl || "").trim();
  const campaign = String(campaignName || "").trim();
  if (!destination) return "";

  try {
    const isAbsolute = /^[a-z][a-z\d+.-]*:/i.test(destination);
    const parsed = new URL(destination, "https://www.bookstore.colostate.edu");
    parsed.searchParams.set("utm_source", "onsite");
    parsed.searchParams.set("utm_medium", "banner");
    if (campaign) parsed.searchParams.set("utm_campaign", campaign);
    else parsed.searchParams.delete("utm_campaign");

    if (isAbsolute) return parsed.href;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    const separator = destination.includes("?") ? "&" : "?";
    const campaignPart = campaign ? `&utm_campaign=${encodeURIComponent(campaign)}` : "";
    return `${destination}${separator}utm_source=onsite&utm_medium=banner${campaignPart}`;
  }
}

function splitTrackedUrl(url) {
  const rawUrl = String(url || "").trim();
  if (!rawUrl) return { destinationUrl: "", campaignName: "" };

  try {
    const isAbsolute = /^[a-z][a-z\d+.-]*:/i.test(rawUrl);
    const parsed = new URL(rawUrl, "https://www.bookstore.colostate.edu");
    const campaignName = parsed.searchParams.get("utm_campaign") || "";
    parsed.searchParams.delete("utm_source");
    parsed.searchParams.delete("utm_medium");
    parsed.searchParams.delete("utm_campaign");
    const destinationUrl = isAbsolute ? parsed.href : `${parsed.pathname}${parsed.search}${parsed.hash}`;
    return { destinationUrl, campaignName };
  } catch {
    return { destinationUrl: rawUrl, campaignName: "" };
  }
}

function makeCampaignName(value) {
  return String(value || "")
    .trim()
    .replace(/&/g, "and")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function resolvePreviewImageUrl(value) {
  const path = String(value || "").trim();
  if (!path) return "";
  if (/^(https?:)?\/\//i.test(path) || /^data:/i.test(path)) return path;
  return new URL(path.replace(/^\/+/, ""), PREVIEW_IMAGE_BASE_URL).href;
}

function refreshOutput() {
  els.output.value = generateOutput();
}

function setStatus(message, type = "") {
  els.parseStatus.textContent = message;
  els.parseStatus.className = `status ${type}`.trim();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

els.fileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const text = await file.text();
  els.sourceInput.value = text;
  setStatus(`Loaded ${file.name}. Click Parse Banners to continue.`, "good");
});

els.parseButton.addEventListener("click", () => {
  try {
    const source = els.sourceInput.value.trim();
    if (!source) throw new Error("Paste or load the current JavaScript first.");
    const parsed = parseSource(source);
    state.source = source;
    state.arrayStart = parsed.range.start;
    state.arrayEnd = parsed.range.end;
    state.banners = parsed.banners;
    state.selectedIndex = parsed.banners.length ? 0 : -1;
    setStatus(`Parsed ${parsed.banners.length} banner entries.`, "good");
    if (state.selectedIndex >= 0) fillForm(state.banners[0], 0);
    else resetForm();
    renderList();
  } catch (error) {
    setStatus(error.message, "bad");
  }
});

els.loadSampleButton.addEventListener("click", () => {
  els.sourceInput.value = DEFAULT_TEMPLATE;
  setStatus("Starter template loaded. Add banners, then export the full script.", "good");
});

els.bannerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const banner = getFormBanner();
  const errors = validateBanner(banner);
  showErrors(errors);
  if (errors.length) return;

  const index = els.editingIndex.value === "" ? -1 : Number(els.editingIndex.value);
  if (index >= 0) {
    state.banners[index] = banner;
    state.selectedIndex = index;
  } else {
    state.banners.push(banner);
    state.selectedIndex = state.banners.length - 1;
  }
  renderList();
  selectBanner(state.selectedIndex);
});

["input", "change"].forEach((eventName) => {
  els.bannerForm.addEventListener(eventName, () => updatePreview(getFormBanner()));
});

els.resetFormButton.addEventListener("click", resetForm);
els.newButton.addEventListener("click", resetForm);

els.desktopPreviewButton.addEventListener("click", () => {
  state.previewMode = "desktop";
  updatePreview();
});

els.mobilePreviewButton.addEventListener("click", () => {
  state.previewMode = "mobile";
  updatePreview();
});

els.copyButton.addEventListener("click", async () => {
  refreshOutput();
  await navigator.clipboard.writeText(els.output.value);
  setStatus("Updated JavaScript copied to clipboard.", "good");
});

els.downloadButton.addEventListener("click", () => {
  refreshOutput();
  const blob = new Blob([els.output.value], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "random-banner.js";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

els.resetAllButton.addEventListener("click", () => {
  if (!window.confirm("Reset the builder? Unsaved form changes and parsed banners will be cleared.")) return;
  state.source = "";
  state.banners = [];
  state.selectedIndex = -1;
  els.sourceInput.value = "";
  setStatus("");
  resetForm();
  els.output.value = "";
});

resetForm();
