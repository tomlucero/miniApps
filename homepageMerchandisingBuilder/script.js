(() => {
  const STORAGE_KEYS = {
    autosave: "csu-homepage-merch-builder-autosave",
    manual: "csu-homepage-merch-builder-manual"
  };
  const BOOKSTORE_BASE_URL = "https://www.bookstore.colostate.edu";

  const SECTIONS = {
    featuredNow: {
      label: "Featured Now",
      shortLabel: "Now",
      guidance: "Featured Now normally works best with 2 to 4 cards.",
      countWord: "cards",
      sectionTitle: "The Latest at CSU Bookstore",
      eyebrow: "Featured Now",
      outputTitle: "Featured Now HTML",
      description: "Large 16:9 promo cards with orange arrow treatment.",
      importSelectors: [
        ".bk-merch__tier[aria-label='Featured promotions'] .bk-merch-card--large",
        ".bk-merch-card--large"
      ],
      fields: [
        { key: "imageUrl", label: "Desktop image URL", type: "url", required: true, hint: "Use the 16:9 feature image URL." },
        { key: "altText", label: "Image alt text", type: "text", required: true, hint: "Describe the image for screen readers." },
        { key: "title", label: "Title", type: "text", required: true },
        { key: "description", label: "Short supporting description", type: "textarea", required: true, rows: 3 },
        { key: "destinationUrl", label: "Destination URL", type: "url", required: true },
        { key: "startDate", label: "Optional start date", type: "date", required: false },
        { key: "endDate", label: "Optional end date", type: "date", required: false }
      ]
    },
    featuredCollections: {
      label: "Featured Collections",
      shortLabel: "Collections",
      guidance: "Featured Collections normally works best with 4 to 8 cards.",
      countWord: "cards",
      sectionTitle: "Featured Collections",
      outputTitle: "Featured Collections HTML",
      description: "Square collection cards with supporting copy.",
      importSelectors: [
        ".bk-merch__tier[aria-label='Featured collections'] .bk-merch-card--small",
        ".bk-merch-card--small"
      ],
      fields: [
        { key: "imageUrl", label: "Square image URL", type: "url", required: true, hint: "Use a square crop when possible." },
        { key: "altText", label: "Image alt text", type: "text", required: true },
        { key: "title", label: "Title", type: "text", required: true },
        { key: "description", label: "Short supporting description", type: "textarea", required: true, rows: 3 },
        { key: "destinationUrl", label: "Destination URL", type: "url", required: true },
        { key: "startDate", label: "Optional start date", type: "date", required: false },
        { key: "endDate", label: "Optional end date", type: "date", required: false }
      ]
    },
    featuredItems: {
      label: "Featured Items",
      shortLabel: "Items",
      guidance: "Featured Items normally works best with 4 to 12 products.",
      countWord: "items",
      sectionTitle: "Featured Products",
      outputTitle: "Featured Items HTML",
      description: "Circular product-image layout for individual items.",
      importSelectors: [
        ".bk-merch__tier[aria-label='Featured products'] .bk-merch-product",
        ".bk-merch-products .bk-merch-product"
      ],
      fields: [
        { key: "imageUrl", label: "Product image URL", type: "url", required: true },
        { key: "altText", label: "Image alt text", type: "text", required: true },
        { key: "title", label: "Product name", type: "text", required: true },
        { key: "destinationUrl", label: "Product URL", type: "url", required: true },
        { key: "startDate", label: "Optional start date", type: "date", required: false },
        { key: "endDate", label: "Optional end date", type: "date", required: false }
      ]
    }
  };

  const sectionOrder = Object.keys(SECTIONS);

  const defaultState = () => ({
    currentSection: "featuredNow",
    previewDevice: "desktop",
    sections: {
      featuredNow: [],
      featuredCollections: [],
      featuredItems: []
    },
    selectedIndex: {
      featuredNow: -1,
      featuredCollections: -1,
      featuredItems: -1
    }
  });

  const dom = {
    moduleButtons: document.getElementById("moduleButtons"),
    addItemButton: document.getElementById("addItemButton"),
    itemList: document.getElementById("itemList"),
    countChip: document.getElementById("countChip"),
    guidanceCopy: document.getElementById("guidanceCopy"),
    editorFields: document.getElementById("editorFields"),
    importInput: document.getElementById("importInput"),
    importButton: document.getElementById("importButton"),
    clearImportButton: document.getElementById("clearImportButton"),
    previewFrame: document.getElementById("previewFrame"),
    previewStage: document.getElementById("previewStage"),
    outputStack: document.getElementById("outputStack"),
    deviceToggle: document.getElementById("deviceToggle"),
    saveDraftButton: document.getElementById("saveDraftButton"),
    loadDraftButton: document.getElementById("loadDraftButton"),
    clearSectionButton: document.getElementById("clearSectionButton"),
    resetAllButton: document.getElementById("resetAllButton"),
    statusBanner: document.getElementById("statusBanner")
  };

  let state = loadInitialState();

  function loadInitialState() {
    const blank = defaultState();
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.autosave);
      if (!raw) return blank;
      return hydrateState(JSON.parse(raw));
    } catch (error) {
      console.warn("Could not load autosaved merchandising draft.", error);
      return blank;
    }
  }

  function hydrateState(input) {
    const blank = defaultState();
    if (!input || typeof input !== "object") return blank;

    blank.currentSection = sectionOrder.includes(input.currentSection) ? input.currentSection : blank.currentSection;
    blank.previewDevice = ["desktop", "tablet", "mobile"].includes(input.previewDevice) ? input.previewDevice : blank.previewDevice;

    sectionOrder.forEach((sectionKey) => {
      const rawItems = Array.isArray(input.sections?.[sectionKey]) ? input.sections[sectionKey] : [];
      blank.sections[sectionKey] = rawItems.map((item) => normalizeItem(sectionKey, item));
      const rawSelected = Number(input.selectedIndex?.[sectionKey]);
      blank.selectedIndex[sectionKey] = Number.isInteger(rawSelected) ? rawSelected : -1;
      blank.selectedIndex[sectionKey] = clampSelectedIndex(sectionKey, blank.selectedIndex[sectionKey], blank.sections[sectionKey]);
    });

    return blank;
  }

  function normalizeItem(sectionKey, item = {}) {
    const base = {
      imageUrl: "",
      altText: "",
      title: "",
      description: "",
      destinationUrl: "",
      startDate: "",
      endDate: ""
    };

    const next = { ...base };
    Object.keys(base).forEach((key) => {
      next[key] = typeof item[key] === "string" ? item[key] : "";
    });

    if (sectionKey === "featuredItems") next.description = "";
    return next;
  }

  function clampSelectedIndex(sectionKey, index, items = getItems(sectionKey)) {
    if (!items.length) return -1;
    if (!Number.isInteger(index) || index < 0) return 0;
    return Math.min(index, items.length - 1);
  }

  function currentSectionKey() {
    return state.currentSection;
  }

  function currentSectionConfig() {
    return SECTIONS[currentSectionKey()];
  }

  function getItems(sectionKey = currentSectionKey()) {
    return state.sections[sectionKey];
  }

  function getSelectedIndex(sectionKey = currentSectionKey()) {
    return state.selectedIndex[sectionKey];
  }

  function getSelectedItem(sectionKey = currentSectionKey()) {
    const index = getSelectedIndex(sectionKey);
    return index >= 0 ? getItems(sectionKey)[index] : null;
  }

  function persistAutosave() {
    localStorage.setItem(STORAGE_KEYS.autosave, JSON.stringify(state));
  }

  function showStatus(message = "", type = "") {
    dom.statusBanner.textContent = message;
    dom.statusBanner.className = `status-banner${type ? ` ${type}` : ""}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function normalizeUrl(url) {
    const trimmed = url.trim();
    if (!trimmed) return "";
    if (/^(https?:\/\/|\/|#|mailto:)/i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }

  function sanitizeUrl(url) {
    const normalized = normalizeUrl(url);
    if (!normalized) return "";
    if (/^(javascript|data):/i.test(normalized)) return "";
    return normalized;
  }

  function resolvePreviewUrl(url) {
    const safeUrl = sanitizeUrl(url);
    if (!safeUrl) return "";
    if (/^https?:\/\//i.test(safeUrl) || /^mailto:/i.test(safeUrl) || safeUrl.startsWith("#")) return safeUrl;
    if (safeUrl.startsWith("/")) return `${BOOKSTORE_BASE_URL}${safeUrl}`;
    return `${BOOKSTORE_BASE_URL}/${safeUrl.replace(/^\/+/, "")}`;
  }

  function buildAriaLabel(title) {
    const cleanTitle = title.trim();
    return cleanTitle ? `Shop ${cleanTitle}` : "Shop featured item";
  }

  function formatSchedule(item) {
    if (!item.startDate && !item.endDate) return "";
    if (item.startDate && item.endDate) return `${item.startDate} to ${item.endDate}`;
    if (item.startDate) return `Starts ${item.startDate}`;
    return `Ends ${item.endDate}`;
  }

  function itemLabel(item, sectionKey = currentSectionKey()) {
    const fallback = sectionKey === "featuredItems" ? "Untitled product" : "Untitled card";
    return item?.title?.trim() || fallback;
  }

  function createBlankItem(sectionKey = currentSectionKey()) {
    return normalizeItem(sectionKey);
  }

  function validateItem(sectionKey, item) {
    const errors = {};
    const config = SECTIONS[sectionKey];

    config.fields.forEach((field) => {
      const value = (item[field.key] || "").trim();
      if (field.required && !value) {
        const fieldName = field.label.replace(/^Optional /, "");
        errors[field.key] = `${fieldName} is required.`;
      }
    });

    if (item.altText.trim() === "") {
      errors.altText = "Alt text cannot be blank.";
    }

    if (item.imageUrl.trim() && !sanitizeUrl(item.imageUrl)) {
      errors.imageUrl = "Enter a valid image URL. Root-relative links like /SiteImages/... are okay.";
    }

    if (item.destinationUrl.trim() && !sanitizeUrl(item.destinationUrl)) {
      errors.destinationUrl = "Enter a valid destination URL. Root-relative links like /shop/... are okay.";
    }

    if (item.startDate && item.endDate && item.endDate < item.startDate) {
      errors.endDate = "End date cannot be earlier than the start date.";
    }

    return errors;
  }

  function sectionHasErrors(sectionKey) {
    return getItems(sectionKey).some((item) => Object.keys(validateItem(sectionKey, item)).length > 0);
  }

  function setCurrentSection(sectionKey) {
    state.currentSection = sectionKey;
    state.selectedIndex[sectionKey] = clampSelectedIndex(sectionKey, state.selectedIndex[sectionKey]);
    persistAutosave();
    render();
  }

  function selectItem(index) {
    const sectionKey = currentSectionKey();
    state.selectedIndex[sectionKey] = clampSelectedIndex(sectionKey, index);
    persistAutosave();
    render();
  }

  function addItem() {
    const sectionKey = currentSectionKey();
    const items = getItems(sectionKey);
    items.push(createBlankItem(sectionKey));
    state.selectedIndex[sectionKey] = items.length - 1;
    persistAutosave();
    render();
    showStatus(`${SECTIONS[sectionKey].label} item added.`);
  }

  function duplicateItem(index) {
    const sectionKey = currentSectionKey();
    const items = getItems(sectionKey);
    if (!items[index]) return;
    const duplicate = JSON.parse(JSON.stringify(items[index]));
    items.splice(index + 1, 0, duplicate);
    state.selectedIndex[sectionKey] = index + 1;
    persistAutosave();
    render();
    showStatus(`${SECTIONS[sectionKey].label} item duplicated.`);
  }

  function deleteItem(index) {
    const sectionKey = currentSectionKey();
    const items = getItems(sectionKey);
    if (!items[index]) return;
    items.splice(index, 1);
    state.selectedIndex[sectionKey] = clampSelectedIndex(sectionKey, index, items);
    persistAutosave();
    render();
    showStatus(`${SECTIONS[sectionKey].label} item deleted.`);
  }

  function moveItem(index, direction) {
    const sectionKey = currentSectionKey();
    const items = getItems(sectionKey);
    const nextIndex = index + direction;
    if (!items[index] || nextIndex < 0 || nextIndex >= items.length) return;
    const [entry] = items.splice(index, 1);
    items.splice(nextIndex, 0, entry);
    state.selectedIndex[sectionKey] = nextIndex;
    persistAutosave();
    render();
  }

  function updateField(fieldKey, value) {
    const item = getSelectedItem();
    if (!item) return;
    const activeElement = document.activeElement;
    const activeId = activeElement?.id || "";
    const selectionStart = typeof activeElement?.selectionStart === "number" ? activeElement.selectionStart : null;
    const selectionEnd = typeof activeElement?.selectionEnd === "number" ? activeElement.selectionEnd : null;
    item[fieldKey] = value;
    persistAutosave();
    render();
    if (activeId) {
      const nextField = document.getElementById(activeId);
      if (nextField) {
        nextField.focus();
        if (selectionStart !== null && selectionEnd !== null && typeof nextField.setSelectionRange === "function") {
          nextField.setSelectionRange(selectionStart, selectionEnd);
        }
      }
    }
  }

  function clearCurrentSection() {
    const sectionKey = currentSectionKey();
    if (!window.confirm(`Clear every entry in ${SECTIONS[sectionKey].label}? This cannot be undone.`)) return;
    state.sections[sectionKey] = [];
    state.selectedIndex[sectionKey] = -1;
    persistAutosave();
    render();
    showStatus(`${SECTIONS[sectionKey].label} was cleared.`);
  }

  function resetAllSections() {
    if (!window.confirm("Reset all three sections and remove saved autosave data from this browser?")) return;
    state = defaultState();
    localStorage.removeItem(STORAGE_KEYS.autosave);
    localStorage.removeItem(STORAGE_KEYS.manual);
    render();
    showStatus("All sections were reset.");
  }

  function saveDraft() {
    localStorage.setItem(STORAGE_KEYS.manual, JSON.stringify(state));
    persistAutosave();
    showStatus("Draft saved in this browser.");
  }

  function loadDraft() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.manual);
      if (!raw) {
        showStatus("No saved draft was found in this browser.", "error");
        return;
      }
      state = hydrateState(JSON.parse(raw));
      persistAutosave();
      render();
      showStatus("Saved draft loaded.");
    } catch (error) {
      console.warn("Could not load saved merchandising draft.", error);
      showStatus("The saved draft could not be loaded.", "error");
    }
  }

  function importCurrentSection() {
    const html = dom.importInput.value.trim();
    if (!html) {
      showStatus("Paste existing HTML first, then import it.", "error");
      return;
    }

    const sectionKey = currentSectionKey();
    const parsed = parseImportedSection(sectionKey, html);
    if (!parsed.items.length) {
      showStatus(`No ${SECTIONS[sectionKey].label} entries were found in the pasted HTML.`, "error");
      return;
    }

    state.sections[sectionKey] = parsed.items;
    state.selectedIndex[sectionKey] = 0;
    persistAutosave();
    render();

    const warningText = parsed.warnings.length ? ` ${parsed.warnings.join(" ")}` : "";
    showStatus(`Imported ${parsed.items.length} ${SECTIONS[sectionKey].countWord} into ${SECTIONS[sectionKey].label}.${warningText}`);
  }

  function parseImportedSection(sectionKey, html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const warnings = [];
    let nodes = [];

    for (const selector of SECTIONS[sectionKey].importSelectors) {
      nodes = Array.from(doc.querySelectorAll(selector));
      if (nodes.length) break;
    }

    if (!nodes.length && sectionKey === "featuredNow") {
      nodes = Array.from(doc.querySelectorAll("a.bk-merch-card"));
    }

    const items = nodes.map((node) => extractItemFromNode(sectionKey, node)).filter(Boolean);

    if (items.some((item) => !item.altText)) {
      warnings.push("Some imported entries did not include alt text and still need review.");
    }

    return { items, warnings };
  }

  function extractItemFromNode(sectionKey, node) {
    const image = node.querySelector("img");
    const titleNode = node.querySelector(sectionKey === "featuredItems" ? ".bk-merch-product__name" : ".bk-merch-card__title");
    const descriptionNode = sectionKey === "featuredItems" ? null : node.querySelector(".bk-merch-card__text");

    const nearestScheduled = node.closest("[data-start], [data-end]");
    const scheduledSource = node.hasAttribute("data-start") || node.hasAttribute("data-end") ? node : nearestScheduled || node;

    return normalizeItem(sectionKey, {
      imageUrl: image?.getAttribute("src") || "",
      altText: image?.getAttribute("alt") || "",
      title: titleNode?.textContent?.trim() || "",
      description: descriptionNode?.textContent?.trim() || "",
      destinationUrl: node.getAttribute("href") || "",
      startDate: scheduledSource.getAttribute("data-start") || "",
      endDate: scheduledSource.getAttribute("data-end") || ""
    });
  }

  function outputAttributes(sectionKey, item, forPreview = false) {
    const attrs = [];
    const safeDestination = sanitizeUrl(item.destinationUrl);
    const safeImage = sanitizeUrl(item.imageUrl);
    const hrefValue = forPreview ? resolvePreviewUrl(item.destinationUrl) : (safeDestination || item.destinationUrl.trim());
    const imageValue = forPreview ? resolvePreviewUrl(item.imageUrl) : (safeImage || item.imageUrl.trim());

    attrs.push(`href="${escapeHtml(hrefValue)}"`);
    attrs.push(`aria-label="${escapeHtml(buildAriaLabel(itemLabel(item, sectionKey)))}"`);
    if (item.startDate) attrs.push(`data-start="${escapeHtml(item.startDate)}"`);
    if (item.endDate) attrs.push(`data-end="${escapeHtml(item.endDate)}"`);

    return {
      attrs: attrs.join(" "),
      imageSrc: escapeHtml(imageValue)
    };
  }

  function generateSectionHtml(sectionKey, forPreview = false) {
    const items = getItems(sectionKey);
    const config = SECTIONS[sectionKey];
    const headingId = {
      featuredNow: "bkMerchHeading",
      featuredCollections: "bkFeaturedCollectionsHeading",
      featuredItems: "bkFeaturedProductsHeading"
    }[sectionKey];

    const lines = [`<section class="bk-merch" aria-labelledby="${headingId}">`, `  <div class="container">`];

    if (sectionKey === "featuredNow") {
      lines.push(`    <div class="bk-merch__header">`);
      lines.push(`      <p class="bk-merch__eyebrow">${escapeHtml(config.eyebrow)}</p>`);
      lines.push(`      <h2 class="bk-merch__heading" id="${headingId}">${escapeHtml(config.sectionTitle)}</h2>`);
      lines.push(`    </div>`);
      lines.push(`    <div class="bk-merch__tier" aria-label="Featured promotions">`);
      lines.push(`      <div class="row g-3 g-lg-4">`);

      items.forEach((item) => {
        const parts = outputAttributes(sectionKey, item, forPreview);
        lines.push(`        <div class="col-12 col-md-6">`);
        lines.push(`          <a class="bk-merch-card bk-merch-card--large" ${parts.attrs}>`);
        lines.push(`            <span class="bk-merch-card__media">`);
        lines.push(`              <img src="${parts.imageSrc}" alt="${escapeHtml(item.altText.trim())}">`);
        lines.push(`            </span>`);
        lines.push(`            <span class="bk-merch-card__body">`);
        lines.push(`              <span class="bk-merch-card__copy">`);
        lines.push(`                <span class="bk-merch-card__title">${escapeHtml(item.title.trim())}</span>`);
        lines.push(`                <span class="bk-merch-card__text">${escapeHtml(item.description.trim())}</span>`);
        lines.push(`              </span>`);
        lines.push(`              <span class="bk-merch-card__arrow" aria-hidden="true"></span>`);
        lines.push(`            </span>`);
        lines.push(`          </a>`);
        lines.push(`        </div>`);
      });

      lines.push(`      </div>`);
      lines.push(`    </div>`);
    }

    if (sectionKey === "featuredCollections") {
      lines.push(`    <div class="bk-merch__tier" aria-label="Featured collections">`);
      lines.push(`      <h3 class="bk-merch__tier-title" id="${headingId}">Featured Collections</h3>`);
      lines.push(`      <div class="row g-3 g-lg-4">`);

      items.forEach((item) => {
        const parts = outputAttributes(sectionKey, item, forPreview);
        lines.push(`        <div class="col-6 col-md-4 col-xl-2">`);
        lines.push(`          <a class="bk-merch-card bk-merch-card--small" ${parts.attrs}>`);
        lines.push(`            <span class="bk-merch-card__media">`);
        lines.push(`              <img src="${parts.imageSrc}" alt="${escapeHtml(item.altText.trim())}">`);
        lines.push(`            </span>`);
        lines.push(`            <span class="bk-merch-card__body">`);
        lines.push(`              <span class="bk-merch-card__copy">`);
        lines.push(`                <span class="bk-merch-card__title">${escapeHtml(item.title.trim())}</span>`);
        lines.push(`                <span class="bk-merch-card__text">${escapeHtml(item.description.trim())}</span>`);
        lines.push(`              </span>`);
        lines.push(`              <span class="bk-merch-card__arrow" aria-hidden="true"></span>`);
        lines.push(`            </span>`);
        lines.push(`          </a>`);
        lines.push(`        </div>`);
      });

      lines.push(`      </div>`);
      lines.push(`    </div>`);
    }

    if (sectionKey === "featuredItems") {
      lines.push(`    <div class="bk-merch__tier" aria-label="Featured products">`);
      lines.push(`      <h3 class="bk-merch__tier-title" id="${headingId}">Featured Products</h3>`);
      lines.push(`      <div class="bk-merch-products">`);

      items.forEach((item) => {
        const parts = outputAttributes(sectionKey, item, forPreview);
        lines.push(`        <a class="bk-merch-product" ${parts.attrs}>`);
        lines.push(`          <span class="bk-merch-product__image">`);
        lines.push(`            <img src="${parts.imageSrc}" alt="${escapeHtml(item.altText.trim())}">`);
        lines.push(`          </span>`);
        lines.push(`          <span class="bk-merch-product__name">${escapeHtml(item.title.trim())}</span>`);
        lines.push(`        </a>`);
      });

      lines.push(`      </div>`);
      lines.push(`    </div>`);
    }

    lines.push(`  </div>`);
    lines.push(`</section>`);

    if (!items.length && forPreview) {
      return "";
    }

    return lines.join("\n");
  }

  function renderModuleButtons() {
    dom.moduleButtons.innerHTML = "";
    sectionOrder.forEach((sectionKey) => {
      const config = SECTIONS[sectionKey];
      const button = document.createElement("button");
      button.className = `module-button${sectionKey === currentSectionKey() ? " active" : ""}`;
      button.type = "button";
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(sectionKey === currentSectionKey()));
      button.innerHTML = `<strong>${config.label}</strong><span>${config.description}</span>`;
      button.addEventListener("click", () => setCurrentSection(sectionKey));
      dom.moduleButtons.appendChild(button);
    });
  }

  function renderItemList() {
    const sectionKey = currentSectionKey();
    const items = getItems(sectionKey);
    const config = currentSectionConfig();
    const countWord = items.length === 1 ? config.countWord.replace(/s$/, "") : config.countWord;

    dom.countChip.textContent = `${items.length} ${countWord}`;
    dom.guidanceCopy.textContent = config.guidance;
    dom.itemList.innerHTML = "";

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "empty-copy";
      empty.textContent = `No ${config.countWord} yet. Add an item to begin building ${config.label}.`;
      dom.itemList.appendChild(empty);
      return;
    }

    items.forEach((item, index) => {
      const card = document.createElement("article");
      card.className = `item-card${index === getSelectedIndex(sectionKey) ? " active" : ""}`;

      const schedule = formatSchedule(item);
      card.innerHTML = `
        <div class="item-card-top">
          <button class="item-summary-button" type="button" data-action="select" data-index="${index}">
            <span class="item-index">${index + 1}</span>
            <span class="item-title">${escapeHtml(itemLabel(item, sectionKey))}</span>
            <span class="item-subtitle">${escapeHtml(item.destinationUrl.trim() || "No destination URL yet")}</span>
            ${schedule ? `<span class="schedule-badge"><i class="fa-regular fa-calendar" aria-hidden="true"></i> ${escapeHtml(schedule)}</span>` : ""}
          </button>
        </div>
        <div class="item-actions">
          <button class="btn btn-outline-secondary" type="button" data-action="up" data-index="${index}">Move Up</button>
          <button class="btn btn-outline-secondary" type="button" data-action="down" data-index="${index}">Move Down</button>
          <button class="btn btn-outline-secondary" type="button" data-action="duplicate" data-index="${index}">Duplicate</button>
          <button class="btn btn-outline-secondary" type="button" data-action="select" data-index="${index}">Edit</button>
          <button class="btn btn-outline-danger" type="button" data-action="delete" data-index="${index}">Delete</button>
        </div>
      `;

      dom.itemList.appendChild(card);
    });
  }

  function renderEditor() {
    const sectionKey = currentSectionKey();
    const config = currentSectionConfig();
    const item = getSelectedItem(sectionKey);
    dom.editorFields.innerHTML = "";

    if (!item) {
      const empty = document.createElement("p");
      empty.className = "empty-copy mb-0";
      empty.textContent = `Select a ${config.countWord.replace(/s$/, "")} to edit, or add a new one.`;
      dom.editorFields.appendChild(empty);
      return;
    }

    const errors = validateItem(sectionKey, item);

    config.fields.forEach((field) => {
      const wrapper = document.createElement("div");
      wrapper.className = `field-row${errors[field.key] ? " is-invalid" : ""}`;

      const label = document.createElement("label");
      label.className = "form-label";
      label.htmlFor = `field-${field.key}`;
      label.textContent = field.label;
      wrapper.appendChild(label);

      let input;
      if (field.type === "textarea") {
        input = document.createElement("textarea");
        input.rows = field.rows || 3;
      } else {
        input = document.createElement("input");
        input.type = field.type;
      }

      input.className = "form-control";
      input.id = `field-${field.key}`;
      input.value = item[field.key] || "";
      input.addEventListener("input", (event) => updateField(field.key, event.target.value));
      wrapper.appendChild(input);

      if (field.hint) {
        const hint = document.createElement("div");
        hint.className = "field-hint";
        hint.textContent = field.hint;
        wrapper.appendChild(hint);
      }

      const error = document.createElement("div");
      error.className = "field-error";
      error.textContent = errors[field.key] || "";
      wrapper.appendChild(error);

      dom.editorFields.appendChild(wrapper);
    });
  }

  function renderPreview() {
    const sectionKey = currentSectionKey();
    const markup = generateSectionHtml(sectionKey, true);

    dom.previewFrame.className = `preview-frame device-${state.previewDevice}`;

    if (!markup) {
      dom.previewStage.innerHTML = `<div class="preview-empty">Add at least one ${SECTIONS[sectionKey].countWord.replace(/s$/, "")} to preview ${SECTIONS[sectionKey].label}.</div>`;
      return;
    }

    dom.previewStage.innerHTML = markup;
  }

  function renderOutputs() {
    dom.outputStack.innerHTML = "";

    sectionOrder.forEach((sectionKey) => {
      const config = SECTIONS[sectionKey];
      const markup = generateSectionHtml(sectionKey, false);
      const itemCount = getItems(sectionKey).length;
      const errorsPresent = sectionHasErrors(sectionKey);
      const outputDisabled = !markup || errorsPresent;

      const panel = document.createElement("section");
      panel.className = `output-card-panel${sectionKey === currentSectionKey() ? " active" : ""}`;

      const codeMarkup = markup
        ? `<pre class="code-output" id="output-${sectionKey}">${escapeHtml(markup)}</pre>`
        : `<p class="output-empty">No HTML yet. Add ${config.countWord} to generate this module.</p>`;

      panel.innerHTML = `
        <div class="output-card-top">
          <div>
            <h3>${config.outputTitle}</h3>
            <span class="output-badge">${itemCount} ${itemCount === 1 ? config.countWord.replace(/s$/, "") : config.countWord}${errorsPresent ? " • needs review" : ""}</span>
          </div>
          <div class="output-actions">
            <button class="btn btn-primary" type="button" data-copy="${sectionKey}" ${outputDisabled ? "disabled" : ""}>Copy HTML</button>
            <button class="btn btn-outline-secondary" type="button" data-select="${sectionKey}" ${outputDisabled ? "disabled" : ""}>Select All</button>
            <button class="btn btn-outline-secondary" type="button" data-download="${sectionKey}" ${outputDisabled ? "disabled" : ""}>Download HTML</button>
          </div>
        </div>
        ${codeMarkup}
      `;

      dom.outputStack.appendChild(panel);
    });
  }

  async function copyOutput(sectionKey) {
    const markup = generateSectionHtml(sectionKey, false);
    if (!markup) return;
    try {
      await navigator.clipboard.writeText(markup);
      showStatus(`${SECTIONS[sectionKey].outputTitle} copied to the clipboard.`);
    } catch (error) {
      console.warn("Clipboard copy failed.", error);
      showStatus("Copy failed in this browser. Try Select All instead.", "error");
    }
  }

  function selectOutput(sectionKey) {
    const output = document.getElementById(`output-${sectionKey}`);
    if (!output) return;
    const range = document.createRange();
    range.selectNodeContents(output);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    showStatus(`${SECTIONS[sectionKey].outputTitle} selected.`);
  }

  function downloadOutput(sectionKey) {
    const markup = generateSectionHtml(sectionKey, false);
    if (!markup) return;
    const blob = new Blob([markup], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${sectionKey}.html`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showStatus(`${SECTIONS[sectionKey].outputTitle} downloaded.`);
  }

  function renderDeviceButtons() {
    Array.from(dom.deviceToggle.querySelectorAll("button")).forEach((button) => {
      const active = button.dataset.device === state.previewDevice;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function render() {
    renderModuleButtons();
    renderItemList();
    renderEditor();
    renderPreview();
    renderOutputs();
    renderDeviceButtons();
  }

  function handleItemListClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const index = Number(button.dataset.index);
    const action = button.dataset.action;

    if (action === "select") selectItem(index);
    if (action === "duplicate") duplicateItem(index);
    if (action === "delete") deleteItem(index);
    if (action === "up") moveItem(index, -1);
    if (action === "down") moveItem(index, 1);
  }

  function handleOutputClick(event) {
    const target = event.target.closest("button");
    if (!target) return;
    if (target.dataset.copy) copyOutput(target.dataset.copy);
    if (target.dataset.select) selectOutput(target.dataset.select);
    if (target.dataset.download) downloadOutput(target.dataset.download);
  }

  function handleDeviceClick(event) {
    const button = event.target.closest("button[data-device]");
    if (!button) return;
    state.previewDevice = button.dataset.device;
    persistAutosave();
    render();
  }

  dom.addItemButton.addEventListener("click", addItem);
  dom.itemList.addEventListener("click", handleItemListClick);
  dom.importButton.addEventListener("click", importCurrentSection);
  dom.clearImportButton.addEventListener("click", () => {
    dom.importInput.value = "";
  });
  dom.deviceToggle.addEventListener("click", handleDeviceClick);
  dom.outputStack.addEventListener("click", handleOutputClick);
  dom.saveDraftButton.addEventListener("click", saveDraft);
  dom.loadDraftButton.addEventListener("click", loadDraft);
  dom.clearSectionButton.addEventListener("click", clearCurrentSection);
  dom.resetAllButton.addEventListener("click", resetAllSections);

  render();
})();
