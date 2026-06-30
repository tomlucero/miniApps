(() => {
  const LOGO_PATH = "../Bookstore-VPSA-CSU-HBlk.png";

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
  const barcodeDisplay = document.getElementById("barcodeDisplay");
  const includeLogo = document.getElementById("includeLogo");
  const excelPaste = document.getElementById("excelPaste");
  const pastePanel = document.getElementById("pastePanel");
  const manualPanel = document.getElementById("manualPanel");
  const listPanel = document.getElementById("listPanel");
  const manualDescription = document.getElementById("manualDescription");
  const manualPrice = document.getElementById("manualPrice");
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

  function normalizeSpecs(value) {
    const cleaned = sanitizeText(value);
    if (!cleaned) return "";
    return cleaned
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join("\n");
  }

  function normalizeItem(item, indexLabel) {
    const description = sanitizeInlineText(item.description);
    const price = normalizePrice(item.price);
    const sku = sanitizeInlineText(item.sku);
    const manufacturerModel = sanitizeInlineText(item.manufacturerModel);
    const barcodeValue = sanitizeInlineText(item.barcodeValue) || sku;
    const techSpecs = normalizeSpecs(item.techSpecs);
    if (!description) throw new Error(`${indexLabel}: Description is required.`);
    if (!sku) throw new Error(`${indexLabel}: SKU / Part Number is required.`);
    if (!manufacturerModel) throw new Error(`${indexLabel}: Manufacturer Model Number is required.`);
    return { description, price, sku, manufacturerModel, barcodeValue, techSpecs };
  }

  function parseExcelItems() {
    const text = excelPaste.value.trim();
    if (!text) throw new Error("Paste at least one row from Excel.");
    const rows = text.split(/\r?\n/).map((row) => row.trim()).filter(Boolean);
    return rows.map((row, index) => {
      const columns = row.split("\t");
      if (columns.length < 4) {
        throw new Error(`Row ${index + 1} must include Description, Price, SKU / Part Number, and Manufacturer Model Number in separate Excel columns.`);
      }
      return normalizeItem({
        description: columns[0],
        price: columns[1],
        sku: columns[2],
        manufacturerModel: columns[3],
        barcodeValue: columns[4] || "",
        techSpecs: columns[5] || ""
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
      meta.textContent = `$${item.price} | SKU: ${item.sku} | MFG: ${item.manufacturerModel} | Barcode: ${item.barcodeValue}`;
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
        price: manualPrice.value,
        sku: manualSku.value,
        manufacturerModel: manualManufacturerModel.value,
        barcodeValue: manualBarcodeValue.value,
        techSpecs: manualTechSpecs.value
      }, "Manual item");
      manualItems.push(item);
      renderManualItems();
      manualDescription.value = "";
      manualPrice.value = "";
      manualSku.value = "";
      manualManufacturerModel.value = "";
      manualBarcodeValue.value = "";
      manualTechSpecs.value = "";
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

  function makeLogoImage() {
    const logo = document.createElement("img");
    logo.className = "sign-logo";
    logo.src = LOGO_PATH;
    logo.alt = "CSU Bookstore";
    logo.addEventListener("load", () => {
      logo.classList.add("is-ready");
    }, { once: true });
    logo.addEventListener("error", () => {
      logo.classList.add("is-hidden");
      logo.removeAttribute("src");
    }, { once: true });
    return logo;
  }

  function barcodeHeightFor(template, mode) {
    if (template.id === "halfSheet") return mode === "textBarcode" ? 24 : 52;
    if (template.id === "fourUp" || template.id === "avery5163" || template.id === "avery8163") {
      return mode === "textBarcode" ? 16 : 28;
    }
    return mode === "textBarcode" ? 10 : 14;
  }

  function barcodeWidthFor(template, value, mode) {
    const base = template.id === "halfSheet"
      ? (mode === "textBarcode" ? 1.15 : 2.1)
      : (template.id === "fourUp" || template.id === "avery5163" || template.id === "avery8163")
        ? (mode === "textBarcode" ? 0.85 : 1.35)
        : (mode === "textBarcode" ? 0.68 : 0.9);
    const min = template.id === "halfSheet" ? (mode === "textBarcode" ? 0.7 : 1.1) : 0.5;
    return Math.max(min, Math.min(base, 22 / Math.max(value.length, 8)));
  }

  function buildSpecsBlock(item, template) {
    if (!item.techSpecs || template.specsMode === "hidden") return null;
    const lines = item.techSpecs.split("\n").filter(Boolean);
    const wrapper = document.createElement("div");
    wrapper.className = "specs-block";

    let visibleLines = lines;
    if (template.specsMode === "short") visibleLines = lines.slice(0, 3);

    const looksLikeList = visibleLines.length > 1;
    if (looksLikeList) {
      const list = document.createElement("ul");
      visibleLines.forEach((line) => {
        const itemNode = document.createElement("li");
        itemNode.textContent = line.replace(/^[\u2022\-*]\s*/, "");
        list.appendChild(itemNode);
      });
      wrapper.appendChild(list);
    } else {
      const paragraph = document.createElement("p");
      paragraph.textContent = visibleLines[0] || "";
      wrapper.appendChild(paragraph);
    }
    return wrapper;
  }

  function buildCard(item, template) {
    const card = document.createElement("article");
    card.className = `price-card ${template.layoutClass} price-${priceSize.value}${includeLogo.checked ? " logo-on" : ""}`;
    const barcodeMode = barcodeDisplay.value;

    const inner = document.createElement("div");
    inner.className = "price-card-inner";

    const descriptionBlock = document.createElement("div");
    descriptionBlock.className = "description-block";
    const description = document.createElement("p");
    description.className = "product-description";
    description.textContent = item.description;
    descriptionBlock.appendChild(description);

    const price = document.createElement("div");
    price.className = "price-value";
    price.textContent = formatPrice(item.price);

    const meta = document.createElement("div");
    meta.className = "meta-block";
    const sku = document.createElement("div");
    sku.className = "meta-line";
    sku.textContent = `SKU / Part Number: ${item.sku}`;
    const model = document.createElement("div");
    model.className = "meta-line";
    model.textContent = `Manufacturer Model Number: ${item.manufacturerModel}`;
    meta.append(sku, model);

    const specsBlock = buildSpecsBlock(item, template);

    const barcodeWrap = document.createElement("div");
    barcodeWrap.className = `barcode-wrap barcode-mode-${barcodeMode}`;
    if (barcodeMode !== "none") {
      const barcodeSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      barcodeSvg.classList.add("barcode-svg");
      JsBarcode(barcodeSvg, item.barcodeValue, {
        format: "CODE128",
        displayValue: barcodeMode === "textBarcode",
        font: "Poppins",
        fontOptions: "600",
        textMargin: template.id === "halfSheet" ? 3 : 2,
        margin: 0,
        width: barcodeWidthFor(template, item.barcodeValue, barcodeMode),
        height: barcodeHeightFor(template, barcodeMode)
      });
      barcodeWrap.appendChild(barcodeSvg);
    }

    const logoWrap = document.createElement("div");
    logoWrap.className = "sign-logo-wrap";
    if (includeLogo.checked) logoWrap.appendChild(makeLogoImage());

    if (template.id === "halfSheet") {
      inner.append(descriptionBlock, price, specsBlock || document.createElement("div"), meta, barcodeWrap, logoWrap);
    } else {
      inner.append(descriptionBlock, price, meta);
      if (specsBlock) inner.append(specsBlock);
      inner.append(barcodeWrap, logoWrap);
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
  [priceSize, barcodeDisplay, includeLogo].forEach((element) => {
    element.addEventListener("change", () => {
      if (generatedCount) clearPreview();
    });
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
