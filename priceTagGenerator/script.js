(() => {
  const PRINT_FORMATS = {
    avery5160: {
      id: "avery5160",
      name: "Avery 5160 Labels",
      layoutClass: "format-avery5160",
      pageWidth: 8.5,
      pageHeight: 11,
      columns: 3,
      rows: 10,
      labelWidth: 2.625,
      labelHeight: 1,
      marginTop: 0.5,
      marginLeft: 0.1875,
      columnGap: 0.125,
      rowGap: 0,
      labelsPerSheet: 30,
      usesStartingPosition: true,
      specsMode: "hidden"
    },
    avery5163: {
      id: "avery5163",
      name: "Avery 5163 Labels",
      layoutClass: "format-avery5163",
      pageWidth: 8.5,
      pageHeight: 11,
      columns: 2,
      rows: 5,
      labelWidth: 4,
      labelHeight: 2,
      marginTop: 0.5,
      marginLeft: 0.15625,
      columnGap: 0.125,
      rowGap: 0,
      labelsPerSheet: 10,
      usesStartingPosition: true,
      specsMode: "short"
    },
    avery8163: {
      id: "avery8163",
      name: "Avery 8163 Labels",
      layoutClass: "format-avery8163",
      pageWidth: 8.5,
      pageHeight: 11,
      columns: 2,
      rows: 5,
      labelWidth: 4,
      labelHeight: 2,
      marginTop: 0.5,
      marginLeft: 0.15625,
      columnGap: 0.125,
      rowGap: 0,
      labelsPerSheet: 10,
      usesStartingPosition: true,
      specsMode: "short"
    },
    ulineS5047: {
      id: "ulineS5047",
      name: "ULINE S-5047 Labels",
      layoutClass: "format-ulineS5047",
      pageWidth: 8.5,
      pageHeight: 11,
      columns: 3,
      rows: 10,
      labelWidth: 2.625,
      labelHeight: 1,
      marginTop: 0.5,
      marginLeft: 0.1875,
      columnGap: 0.125,
      rowGap: 0,
      labelsPerSheet: 30,
      usesStartingPosition: true,
      specsMode: "hidden"
    },
    fourUp: {
      id: "fourUp",
      name: "4-Up Price Signs",
      layoutClass: "format-fourUp",
      pageWidth: 8.5,
      pageHeight: 11,
      columns: 2,
      rows: 2,
      labelWidth: 4,
      labelHeight: 5.25,
      marginTop: 0.25,
      marginLeft: 0.25,
      columnGap: 0,
      rowGap: 0,
      labelsPerSheet: 4,
      usesStartingPosition: false,
      specsMode: "short"
    },
    halfSheet: {
      id: "halfSheet",
      name: "Half-Sheet Price Sign",
      layoutClass: "format-halfSheet",
      pageWidth: 8.5,
      pageHeight: 11,
      columns: 1,
      rows: 2,
      labelWidth: 8.5,
      labelHeight: 5.5,
      marginTop: 0,
      marginLeft: 0,
      columnGap: 0,
      rowGap: 0,
      labelsPerSheet: 2,
      usesStartingPosition: false,
      specsMode: "full"
    }
  };

  const REQUIRED_TEMPLATE_FIELDS = [
    "id", "name", "layoutClass", "pageWidth", "pageHeight", "columns", "rows",
    "labelWidth", "labelHeight", "marginTop", "marginLeft", "columnGap", "rowGap"
  ];

  const form = document.getElementById("tagForm");
  const labelTemplate = document.getElementById("labelTemplate");
  const startingRow = document.getElementById("startingRow");
  const startingColumn = document.getElementById("startingColumn");
  const priceSize = document.getElementById("priceSize");
  const signType = document.getElementById("signType");
  const printStyle = document.getElementById("printStyle");
  const iconSelect = document.getElementById("iconSelect");
  const barcodeDisplay = document.getElementById("barcodeDisplay");
  const showBarcodeText = document.getElementById("showBarcodeText");
  const excelPaste = document.getElementById("excelPaste");
  const pastePanel = document.getElementById("pastePanel");
  const manualPanel = document.getElementById("manualPanel");
  const listPanel = document.getElementById("listPanel");
  const manualDescription = document.getElementById("manualDescription");
  const manualPrice = document.getElementById("manualPrice");
  const manualSalePrice = document.getElementById("manualSalePrice");
  const manualSku = document.getElementById("manualSku");
  const manualManufacturerModel = document.getElementById("manualManufacturerModel");
  const manualBarcodeValue = document.getElementById("manualBarcodeValue");
  const manualTechSpecs = document.getElementById("manualTechSpecs");
  const manualList = document.getElementById("manualList");
  const manualEmpty = document.getElementById("manualEmpty");
  const formStatus = document.getElementById("formStatus");
  const screenPreview = document.getElementById("screenPreview");
  const printArea = document.getElementById("printArea");
  const previewEmpty = document.getElementById("previewEmpty");
  const printButton = document.getElementById("printButton");
  const newSheetButton = document.getElementById("newSheetButton");

  let availableTemplates = [];
  let generatedCount = 0;
  let manualItems = [];
  const ICON_MAP = {
    ramLine: { className: "fa-ram-line", label: "Ram Line Art" },
    aggieA: { className: "fa-aggie-a", label: "Aggie A" },
    book: { className: "fa-solid fa-book", label: "Book" },
    laptop: { className: "fa-solid fa-laptop", label: "Laptop" },
    gift: { className: "fa-solid fa-gift", label: "Gift" },
    saleTag: { className: "fa-solid fa-tags", label: "Sale Tag" },
    clearance: { className: "fa-solid fa-percent", label: "Clearance" },
    graduation: { className: "fa-solid fa-graduation-cap", label: "Graduation" }
  };
  const ALLOWED_TAGS = new Set(["P", "BR", "STRONG", "EM", "UL", "OL", "LI"]);

  function selectedMethod() {
    return form.elements.entryMethod.value;
  }

  function currentTemplate() {
    const template = availableTemplates.find(({ id }) => id === labelTemplate.value);
    if (!template) {
      throw new Error("The selected print format is unavailable. Choose a valid format and try again.");
    }
    return template;
  }

  function showStatus(message = "", type = "") {
    formStatus.textContent = message;
    formStatus.className = `form-status mt-3${type ? ` ${type}` : ""}`;
  }

  function validateTemplate(template, configKey, usedIds) {
    if (!template || typeof template !== "object" || Array.isArray(template)) {
      throw new Error(`Format “${configKey}” must be a configuration object.`);
    }
    const missingFields = REQUIRED_TEMPLATE_FIELDS.filter((field) => !(field in template) || template[field] === "" || template[field] == null);
    if (missingFields.length) {
      throw new Error(`Format “${configKey}” is missing: ${missingFields.join(", ")}.`);
    }
    if (usedIds.has(template.id)) {
      throw new Error(`Format id “${template.id}” is used more than once.`);
    }
    const positiveFields = ["pageWidth", "pageHeight", "columns", "rows", "labelWidth", "labelHeight"];
    const invalidPositive = positiveFields.filter((field) => !Number.isFinite(template[field]) || template[field] <= 0);
    const invalidNonNegative = ["marginTop", "marginLeft", "columnGap", "rowGap"].filter((field) => !Number.isFinite(template[field]) || template[field] < 0);
    if (invalidPositive.length || invalidNonNegative.length) {
      throw new Error(`Format “${template.id}” has invalid measurements: ${[...invalidPositive, ...invalidNonNegative].join(", ")}.`);
    }
    const calculatedCapacity = template.columns * template.rows;
    const labelsPerSheet = template.labelsPerSheet ?? calculatedCapacity;
    if (!Number.isInteger(labelsPerSheet) || labelsPerSheet !== calculatedCapacity) {
      throw new Error(`Format “${template.id}” labelsPerSheet must equal columns × rows (${calculatedCapacity}).`);
    }
    usedIds.add(template.id);
    return { ...template, labelsPerSheet };
  }

  function loadTemplates() {
    const usedIds = new Set();
    const errors = [];
    availableTemplates = Object.entries(PRINT_FORMATS).flatMap(([configKey, template]) => {
      try {
        return [validateTemplate(template, configKey, usedIds)];
      } catch (error) {
        errors.push(error.message);
        return [];
      }
    });
    if (!availableTemplates.length) {
      throw new Error(`No valid print formats are available.${errors.length ? ` ${errors.join(" ")}` : ""}`);
    }
    return errors;
  }

  function populateTemplateOptions() {
    labelTemplate.replaceChildren();
    availableTemplates.forEach((template) => {
      const option = document.createElement("option");
      option.value = template.id;
      option.textContent = `${template.name} — ${template.labelsPerSheet} per page`;
      labelTemplate.appendChild(option);
    });
  }

  function updateSummaryPosition() {
    const template = currentTemplate();
    const text = template.usesStartingPosition ? `Row ${startingRow.value || 1}, Column ${startingColumn.value || 1}` : "Not used for this format";
    document.getElementById("startingPosition").textContent = text;
  }

  function populatePositionOptions() {
    const template = currentTemplate();
    const previousRow = Math.min(Number(startingRow.value) || 1, template.rows);
    const previousColumn = Math.min(Number(startingColumn.value) || 1, template.columns);
    startingRow.replaceChildren();
    startingColumn.replaceChildren();
    for (let row = 1; row <= template.rows; row += 1) startingRow.add(new Option(`Row ${row}`, String(row)));
    for (let column = 1; column <= template.columns; column += 1) startingColumn.add(new Option(`Column ${column}`, String(column)));
    startingRow.value = String(previousRow);
    startingColumn.value = String(previousColumn);
    startingRow.disabled = !template.usesStartingPosition;
    startingColumn.disabled = !template.usesStartingPosition;
    document.getElementById("templateName").textContent = template.name;
    updateSummaryPosition();
  }

  function setEntryMode() {
    const manual = selectedMethod() === "manual";
    pastePanel.classList.toggle("d-none", manual);
    manualPanel.classList.toggle("d-none", !manual);
    listPanel.classList.toggle("d-none", !manual);
    if (generatedCount) clearPreview();
  }

  function sanitizeText(value) {
    return (value || "").replace(/\r/g, "").trim();
  }

  function sanitizeInlineText(value) {
    return sanitizeText(value).replace(/\s+/g, " ");
  }

  function normalizePrice(value) {
    const cleaned = sanitizeInlineText(value).replace(/[$,]/g, "");
    if (!cleaned) throw new Error("Price is required for every item.");
    if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
      throw new Error(`Price "${value}" must be a number like 24.99.`);
    }
    return Number(cleaned).toFixed(2);
  }

  function looksLikePrice(value) {
    if (!sanitizeInlineText(value)) return false;
    return /^\$?\d[\d,]*(\.\d{1,2})?$/.test(sanitizeInlineText(value));
  }

  function normalizeOptionalPrice(value) {
    if (!sanitizeInlineText(value)) return "";
    return normalizePrice(value);
  }

  function normalizeSpecs(value) {
    const cleaned = sanitizeText(value);
    if (!cleaned) return "";
    return cleaned
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join("\n");
  }

  function sanitizeSpecsHtml(value) {
    if (!value) return "";
    const template = document.createElement("template");
    template.innerHTML = value;

    const cleanNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent || "");
      if (node.nodeType !== Node.ELEMENT_NODE) return document.createTextNode("");

      const tagName = node.tagName.toUpperCase();
      if (!ALLOWED_TAGS.has(tagName)) {
        const fragment = document.createDocumentFragment();
        Array.from(node.childNodes).forEach((child) => {
          fragment.appendChild(cleanNode(child));
        });
        return fragment;
      }

      const clean = document.createElement(tagName.toLowerCase());
      Array.from(node.childNodes).forEach((child) => {
        clean.appendChild(cleanNode(child));
      });
      return clean;
    };

    const fragment = document.createDocumentFragment();
    Array.from(template.content.childNodes).forEach((child) => {
      fragment.appendChild(cleanNode(child));
    });
    const wrapper = document.createElement("div");
    wrapper.appendChild(fragment);
    const normalized = wrapper.innerHTML
      .replace(/<p><\/p>/g, "")
      .replace(/<(strong|em|li)>\s*<\/\1>/g, "")
      .trim();
    return normalized;
  }

  function htmlToPlainText(value) {
    if (!value) return "";
    const wrapper = document.createElement("div");
    wrapper.innerHTML = value;
    return sanitizeText(wrapper.textContent || "");
  }

  function editorHasContent() {
    return sanitizeText(manualTechSpecs.textContent || "").length > 0;
  }

  function clearEditor() {
    manualTechSpecs.innerHTML = "";
  }

  function getEditorHtml() {
    return sanitizeSpecsHtml(manualTechSpecs.innerHTML);
  }

  function normalizeItem(item, indexLabel) {
    const description = sanitizeInlineText(item.description);
    const regularPrice = normalizePrice(item.regularPrice ?? item.price);
    const salePrice = normalizeOptionalPrice(item.salePrice);
    const sku = sanitizeInlineText(item.sku);
    const manufacturerModel = sanitizeInlineText(item.manufacturerModel);
    const barcodeValue = sanitizeInlineText(item.barcodeValue) || sku;
    const techSpecsHtml = item.techSpecsHtml
      ? sanitizeSpecsHtml(item.techSpecsHtml)
      : (() => {
        const normalizedText = normalizeSpecs(item.techSpecs);
        if (!normalizedText) return "";
        if (normalizedText.includes("\n")) {
          const items = normalizedText.split("\n").map((line) => `<li>${line.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`).join("");
          return `<ul>${items}</ul>`;
        }
        return `<p>${normalizedText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
      })();
    const techSpecs = htmlToPlainText(techSpecsHtml);
    if (!description) throw new Error(`${indexLabel}: Description is required.`);
    if (!sku) throw new Error(`${indexLabel}: SKU / UPC is required.`);
    if (!manufacturerModel) throw new Error(`${indexLabel}: MFG MOD is required.`);
    return { description, regularPrice, salePrice, sku, manufacturerModel, barcodeValue, techSpecs, techSpecsHtml };
  }

  function parseExcelItems() {
    const text = excelPaste.value.trim();
    if (!text) throw new Error("Paste at least one row from Excel.");
    const rows = text.split(/\r?\n/).map((row) => row.trim()).filter(Boolean);
    return rows.map((row, index) => {
      const columns = row.split("\t");
      if (columns.length < 4) {
        throw new Error(`Row ${index + 1} must include Description, Regular Price, SKU / UPC, and MFG MOD in separate Excel columns.`);
      }
      const usesSalePriceColumn = columns.length >= 5 && looksLikePrice(columns[2]);
      return normalizeItem({
        description: columns[0],
        regularPrice: columns[1],
        salePrice: usesSalePriceColumn ? columns[2] : "",
        sku: usesSalePriceColumn ? columns[3] : columns[2],
        manufacturerModel: usesSalePriceColumn ? columns[4] : columns[3],
        barcodeValue: usesSalePriceColumn ? (columns[5] || "") : (columns[4] || ""),
        techSpecs: usesSalePriceColumn ? (columns[6] || "") : (columns[5] || "")
      }, `Row ${index + 1}`);
    });
  }

  function currentItems() {
    if (selectedMethod() === "paste") return parseExcelItems();
    if (!manualItems.length) throw new Error("Add at least one manual item before generating tags.");
    return manualItems;
  }

  function updateQueueCount() {
    const count = manualItems.length;
    document.getElementById("queueCount").textContent = `${count} ${count === 1 ? "item" : "items"}`;
  }

  function renderManualItems() {
    manualList.replaceChildren();
    manualEmpty.classList.toggle("d-none", manualItems.length > 0);
    manualItems.forEach((item, index) => {
      const wrapper = document.createElement("div");
      wrapper.className = "manual-item";

      const info = document.createElement("div");
      const title = document.createElement("p");
      title.className = "manual-item-title";
      title.textContent = item.description;
      const meta = document.createElement("div");
      meta.className = "manual-item-meta";
      const priceSummary = item.salePrice
        ? `Regular: $${item.regularPrice} | Sale: $${item.salePrice}`
        : `Regular: $${item.regularPrice}`;
      meta.textContent = `${priceSummary} | SKU / UPC: ${item.sku} | MFG MOD: ${item.manufacturerModel} | Barcode: ${item.barcodeValue}`;
      info.append(title, meta);
      if (item.techSpecs) {
        const specs = document.createElement("div");
        specs.className = "manual-item-specs";
        specs.textContent = item.techSpecs;
        info.appendChild(specs);
      }

      const removeButton = document.createElement("button");
      removeButton.className = "btn btn-outline-danger btn-sm";
      removeButton.type = "button";
      removeButton.dataset.index = String(index);
      removeButton.innerHTML = '<i class="fa-solid fa-trash" aria-hidden="true"></i> Remove Item';
      wrapper.append(info, removeButton);
      manualList.appendChild(wrapper);
    });
    updateQueueCount();
  }

  function addManualItem() {
    try {
      const item = normalizeItem({
        description: manualDescription.value,
        regularPrice: manualPrice.value,
        salePrice: manualSalePrice.value,
        sku: manualSku.value,
        manufacturerModel: manualManufacturerModel.value,
        barcodeValue: manualBarcodeValue.value,
        techSpecsHtml: getEditorHtml()
      }, "Manual item");
      manualItems.push(item);
      renderManualItems();
      manualDescription.value = "";
      manualPrice.value = "";
      manualSalePrice.value = "";
      manualSku.value = "";
      manualManufacturerModel.value = "";
      manualBarcodeValue.value = "";
      clearEditor();
      showStatus("Manual item added.", "success");
      if (generatedCount) clearPreview();
      manualDescription.focus();
    } catch (error) {
      showStatus(error.message, "error");
    }
  }

  function removeManualItem(index) {
    manualItems.splice(index, 1);
    renderManualItems();
    showStatus(manualItems.length ? "Manual item removed." : "", manualItems.length ? "success" : "");
    if (generatedCount) clearPreview();
  }

  function formatPrice(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value));
  }

  function applyTemplateVariables(sheet, template) {
    const marginRight = template.pageWidth - template.marginLeft - (template.columns * template.labelWidth) - ((template.columns - 1) * template.columnGap);
    const marginBottom = template.pageHeight - template.marginTop - (template.rows * template.labelHeight) - ((template.rows - 1) * template.rowGap);
    const values = {
      "--page-width": `${template.pageWidth}in`,
      "--page-height": `${template.pageHeight}in`,
      "--columns": template.columns,
      "--rows": template.rows,
      "--label-width": `${template.labelWidth}in`,
      "--label-height": `${template.labelHeight}in`,
      "--margin-top": `${template.marginTop}in`,
      "--margin-left": `${template.marginLeft}in`,
      "--column-gap": `${template.columnGap}in`,
      "--row-gap": `${template.rowGap}in`,
      "--preview-aspect": template.pageWidth / template.pageHeight,
      "--preview-pad-top": `${(template.marginTop / template.pageHeight) * 100}%`,
      "--preview-pad-right": `${(marginRight / template.pageWidth) * 100}%`,
      "--preview-pad-bottom": `${(marginBottom / template.pageHeight) * 100}%`,
      "--preview-pad-left": `${(template.marginLeft / template.pageWidth) * 100}%`,
      "--preview-column-gap": `${(template.columnGap / template.pageWidth) * 100}%`,
      "--preview-row-gap": `${(template.rowGap / template.pageHeight) * 100}%`
    };
    Object.entries(values).forEach(([property, value]) => sheet.style.setProperty(property, value));
  }

  function barcodeHeightFor(template, showText) {
    if (template.id === "halfSheet") return showText ? 14 : 18;
    if (template.id === "fourUp" || template.id === "avery5163" || template.id === "avery8163") {
      return showText ? 11 : 14;
    }
    return showText ? 8 : 10;
  }

  function barcodeWidthFor(template, value, showText) {
    const base = template.id === "halfSheet"
      ? (showText ? 0.62 : 0.72)
      : (template.id === "fourUp" || template.id === "avery5163" || template.id === "avery8163")
        ? (showText ? 0.54 : 0.64)
        : (showText ? 0.42 : 0.5);
    const min = template.id === "halfSheet" ? 0.48 : 0.32;
    return Math.max(min, Math.min(base, 22 / Math.max(value.length, 8)));
  }

  function barcodeTextSizeFor(template, showText) {
    if (!showText) return undefined;
    if (template.id === "avery5160") return 9.5;
    if (template.id === "halfSheet") return 12;
    if (template.id === "fourUp" || template.id === "avery5163" || template.id === "avery8163") return 10.5;
    return 10;
  }

  function barcodeTextMarginFor(template, showText) {
    if (!showText) return 0;
    if (template.id === "avery5160") return 4;
    if (template.id === "halfSheet") return 3;
    return 2;
  }

  function currentSignLabel(template) {
    if (signType.value === "regular") return "";
    if (template.id === "avery5160" || template.id === "ulineS5047") return "";
    return signType.value === "sale" ? "Sale" : "Clearance";
  }

  function shouldUseAlternatePrice(item) {
    return signType.value !== "regular" && Boolean(item.salePrice);
  }

  function currentPrimaryPrice(item) {
    return shouldUseAlternatePrice(item) ? item.salePrice : item.regularPrice;
  }

  function buildIcon() {
    const config = ICON_MAP[iconSelect.value];
    if (!config) return null;
    const wrapper = document.createElement("span");
    wrapper.className = "product-icon";
    wrapper.setAttribute("aria-hidden", "true");
    const icon = document.createElement("i");
    icon.className = config.className;
    wrapper.appendChild(icon);
    return wrapper;
  }

  function buildSpecsBlock(item, template) {
    if (!item.techSpecsHtml || template.specsMode === "hidden") return null;
    const wrapper = document.createElement("div");
    wrapper.className = "specs-block";
    const templateEl = document.createElement("template");
    templateEl.innerHTML = item.techSpecsHtml;
    const nodes = Array.from(templateEl.content.childNodes);

    nodes.forEach((node) => {
      if (template.specsMode !== "short") {
        wrapper.appendChild(node.cloneNode(true));
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const tagName = node.tagName.toUpperCase();
      if (tagName === "UL" || tagName === "OL") {
        const nextList = document.createElement(tagName.toLowerCase());
        Array.from(node.children).slice(0, 3).forEach((child) => {
          nextList.appendChild(child.cloneNode(true));
        });
        if (nextList.children.length) wrapper.appendChild(nextList);
      } else if (!wrapper.childNodes.length) {
        wrapper.appendChild(node.cloneNode(true));
      }
    });

    if (!wrapper.childNodes.length && item.techSpecs) {
      const paragraph = document.createElement("p");
      paragraph.textContent = item.techSpecs;
      wrapper.appendChild(paragraph);
    }
    return wrapper;
  }

  function buildCard(item, template) {
    const card = document.createElement("article");
    const barcodeMode = barcodeDisplay.value;
    const renderBarcodeText = barcodeMode !== "none" && showBarcodeText.checked;
    card.className = `price-card ${template.layoutClass} price-${priceSize.value} barcode-${barcodeMode} sign-${signType.value} print-${printStyle.value} ${renderBarcodeText ? "barcode-text-on" : "barcode-text-off"}`;

    const inner = document.createElement("div");
    inner.className = "price-card-inner";
    const accent = document.createElement("div");
    accent.className = "sign-accent";

    const descriptionBlock = document.createElement("div");
    descriptionBlock.className = "description-block";
    const header = document.createElement("div");
    header.className = "sign-header";
    const icon = buildIcon();
    if (icon) header.appendChild(icon);
    const productHead = document.createElement("div");
    productHead.className = "product-head";
    const signLabel = currentSignLabel(template);
    if (signLabel) {
      const badge = document.createElement("span");
      badge.className = "sign-badge";
      badge.textContent = signLabel;
      productHead.appendChild(badge);
    }
    const description = document.createElement("p");
    description.className = "product-description";
    description.textContent = item.description;
    productHead.appendChild(description);
    header.appendChild(productHead);
    descriptionBlock.appendChild(header);

    const priceBlock = document.createElement("div");
    priceBlock.className = "price-block";
    const usesAlternatePrice = shouldUseAlternatePrice(item);
    if (usesAlternatePrice) {
      const was = document.createElement("div");
      was.className = "was-price";
      const wasLabel = document.createElement("span");
      wasLabel.className = "was-price-label";
      wasLabel.textContent = "Was";
      const wasValue = document.createElement("span");
      wasValue.className = "was-price-value";
      wasValue.textContent = formatPrice(item.regularPrice);
      was.append(wasLabel, wasValue);
      priceBlock.appendChild(was);
    }

    const price = document.createElement("div");
    price.className = "price-value";
    price.textContent = formatPrice(currentPrimaryPrice(item));
    if (usesAlternatePrice) {
      const nowLabel = document.createElement("div");
      nowLabel.className = `now-price-label now-${signType.value}`;
      nowLabel.textContent = signType.value === "sale" ? "Now" : "Clearance Price";
      priceBlock.append(nowLabel, price);
    } else {
      priceBlock.appendChild(price);
    }

    const meta = document.createElement("div");
    meta.className = "meta-block";
    const sku = document.createElement("div");
    sku.className = "meta-line";
    sku.textContent = `SKU / UPC: ${item.sku}`;
    const model = document.createElement("div");
    model.className = "meta-line";
    model.textContent = `MFG MOD: ${item.manufacturerModel}`;
    meta.append(sku, model);

    const specsBlock = buildSpecsBlock(item, template);

    const barcodeWrap = document.createElement("div");
    barcodeWrap.className = `barcode-wrap barcode-mode-${barcodeMode}`;
    if (barcodeMode !== "none") {
      const barcodeSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      barcodeSvg.classList.add("barcode-svg");
      JsBarcode(barcodeSvg, item.barcodeValue, {
        format: "CODE128",
        displayValue: renderBarcodeText,
        font: "Poppins",
        fontOptions: "600",
        fontSize: barcodeTextSizeFor(template, renderBarcodeText),
        textMargin: barcodeTextMarginFor(template, renderBarcodeText),
        margin: 0,
        width: barcodeWidthFor(template, item.barcodeValue, renderBarcodeText),
        height: barcodeHeightFor(template, renderBarcodeText)
      });
      barcodeWrap.appendChild(barcodeSvg);
    }

    if (template.id === "halfSheet") {
      inner.append(accent, descriptionBlock, priceBlock, specsBlock || document.createElement("div"), meta, barcodeWrap);
    } else {
      inner.append(accent, descriptionBlock, priceBlock, meta);
      if (specsBlock) inner.append(specsBlock);
      inner.append(barcodeWrap);
    }

    card.appendChild(inner);
    return card;
  }

  function createSheet(template, startIndex, items) {
    const sheet = document.createElement("section");
    sheet.className = "label-sheet";
    applyTemplateVariables(sheet, template);
    const capacity = template.labelsPerSheet;
    let placed = 0;
    for (let slotIndex = 0; slotIndex < capacity; slotIndex += 1) {
      const slot = document.createElement("div");
      slot.className = "label-slot";
      if (slotIndex >= startIndex && placed < items.length) {
        slot.appendChild(buildCard(items[placed], template));
        placed += 1;
      }
      sheet.appendChild(slot);
    }
    return { sheet, placed };
  }

  function clearPreview() {
    generatedCount = 0;
    screenPreview.replaceChildren();
    printArea.replaceChildren();
    previewEmpty.classList.remove("d-none");
    printButton.disabled = true;
    newSheetButton.disabled = true;
    document.getElementById("sheetCount").textContent = "0 sheets";
    document.getElementById("totalGenerated").textContent = "0";
    showStatus();
  }

  function generateTags() {
    try {
      const items = currentItems();
      const template = currentTemplate();
      const startIndex = template.usesStartingPosition
        ? (Number(startingRow.value) - 1) * template.columns + (Number(startingColumn.value) - 1)
        : 0;

      screenPreview.replaceChildren();
      printArea.replaceChildren();

      let remainingItems = [...items];
      let pageIndex = 0;
      let generated = 0;

      while (remainingItems.length > 0) {
        const pageStart = pageIndex === 0 ? startIndex : 0;
        const available = template.labelsPerSheet - pageStart;
        const pageItems = remainingItems.slice(0, available);
        const screenSheet = createSheet(template, pageStart, pageItems);
        const printSheet = createSheet(template, pageStart, pageItems);
        screenPreview.appendChild(screenSheet.sheet);
        printArea.appendChild(printSheet.sheet);
        generated += screenSheet.placed;
        remainingItems = remainingItems.slice(screenSheet.placed);
        pageIndex += 1;
      }

      generatedCount = generated;
      previewEmpty.classList.add("d-none");
      printButton.disabled = false;
      newSheetButton.disabled = false;
      document.getElementById("totalRequested").textContent = String(items.length);
      document.getElementById("totalGenerated").textContent = String(generated);
      document.getElementById("templateName").textContent = template.name;
      updateSummaryPosition();
      document.getElementById("sheetCount").textContent = `${pageIndex} ${pageIndex === 1 ? "sheet" : "sheets"}`;
      showStatus(`${generated} ${generated === 1 ? "price tag or sign is" : "price tags or signs are"} ready to print.`, "success");
      return true;
    } catch (error) {
      clearPreview();
      showStatus(error.message, "error");
      return false;
    }
  }

  function resetApp() {
    form.reset();
    labelTemplate.value = availableTemplates[0]?.id || "";
    manualItems = [];
    excelPaste.value = "";
    clearEditor();
    renderManualItems();
    populatePositionOptions();
    setEntryMode();
    updateSummaryPosition();
    document.getElementById("totalRequested").textContent = "0";
    clearPreview();
  }

  function prepareAnotherSheet() {
    const template = currentTemplate();
    if (template.usesStartingPosition) {
      startingRow.value = "1";
      startingColumn.value = "1";
    }
    updateSummaryPosition();
    clearPreview();
    if (selectedMethod() === "paste") excelPaste.focus();
    else manualDescription.focus();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    generateTags();
  });

  form.addEventListener("input", () => {
    if (generatedCount) clearPreview();
  });

  labelTemplate.addEventListener("change", () => {
    populatePositionOptions();
    if (generatedCount) clearPreview();
  });
  startingRow.addEventListener("change", updateSummaryPosition);
  startingColumn.addEventListener("change", updateSummaryPosition);
  [priceSize, signType, printStyle, iconSelect, barcodeDisplay, showBarcodeText].forEach((element) => {
    element.addEventListener("change", () => {
      if (generatedCount) clearPreview();
    });
  });
  document.querySelectorAll("[data-editor-command]").forEach((button) => {
    button.addEventListener("click", () => {
      manualTechSpecs.focus();
      document.execCommand(button.dataset.editorCommand, false);
      manualTechSpecs.dispatchEvent(new Event("input", { bubbles: true }));
    });
  });
  manualTechSpecs.addEventListener("blur", () => {
    const sanitized = getEditorHtml();
    manualTechSpecs.innerHTML = sanitized;
  });
  document.querySelectorAll('input[name="entryMethod"]').forEach((input) => {
    input.addEventListener("change", setEntryMode);
  });
  document.getElementById("addItemButton").addEventListener("click", addManualItem);
  manualList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-index]");
    if (!button) return;
    removeManualItem(Number(button.dataset.index));
  });
  document.getElementById("resetButton").addEventListener("click", resetApp);
  newSheetButton.addEventListener("click", prepareAnotherSheet);
  printButton.addEventListener("click", () => {
    if (!generatedCount || !generateTags()) return;
    window.print();
  });

  try {
    const templateErrors = loadTemplates();
    populateTemplateOptions();
    populatePositionOptions();
    renderManualItems();
    setEntryMode();
    if (templateErrors.length) {
      showStatus(`Some print formats could not be loaded: ${templateErrors.join(" ")}`, "error");
    }
  } catch (error) {
    labelTemplate.replaceChildren(new Option("No valid print formats available", ""));
    labelTemplate.disabled = true;
    startingRow.disabled = true;
    startingColumn.disabled = true;
    form.querySelector('button[type="submit"]').disabled = true;
    showStatus(error.message, "error");
  }
})();
