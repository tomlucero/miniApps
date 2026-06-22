(() => {
const LABEL_TEMPLATES = {
  avery5160: {
    id: "avery5160",
    name: "Avery 5160",
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
    labelsPerSheet: 30
  },

  ulineS5047: {
    id: "ulineS5047",
    name: "ULINE S-5047",
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
    labelsPerSheet: 30
  },

  avery5163: {
    id: "avery5163",
    name: "Avery 5163",
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
    labelsPerSheet: 10
  }
};

  const form = document.getElementById("labelForm");
  const packedDate = document.getElementById("packedDate");
  const labelCount = document.getElementById("labelCount");
  const labelTemplate = document.getElementById("labelTemplate");
  const startingRow = document.getElementById("startingRow");
  const startingColumn = document.getElementById("startingColumn");
  const formStatus = document.getElementById("formStatus");
  const screenPreview = document.getElementById("screenPreview");
  const printArea = document.getElementById("printArea");
  const previewEmpty = document.getElementById("previewEmpty");
  const printButton = document.getElementById("printButton");
  const newSheetButton = document.getElementById("newSheetButton");

  let generatedLabelCount = 0;

  function localDateInputValue(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function parseLocalDate(value) {
    const parts = value.split("-").map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    const date = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0, 0);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
  }

  function currentTemplate() {
    return LABEL_TEMPLATES[labelTemplate.value];
  }

  function selectedStyle() {
    return form.elements.labelStyle.value;
  }

  function showStatus(message = "", type = "") {
    formStatus.textContent = message;
    formStatus.className = `form-status mt-3${type ? ` ${type}` : ""}`;
  }

  function populateTemplateOptions() {
    labelTemplate.replaceChildren();
    Object.values(LABEL_TEMPLATES).forEach((template) => {
      const option = document.createElement("option");
      option.value = template.id;
      option.textContent = `${template.name} — ${template.columns * template.rows} labels`;
      labelTemplate.appendChild(option);
    });
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
    document.getElementById("templateName").textContent = template.name;
    updateSummaryPosition();
  }

  function updateSummaryPosition() {
    document.getElementById("startingPosition").textContent = `Row ${startingRow.value || 1}, Column ${startingColumn.value || 1}`;
  }

  function updateCalculatedDates() {
    const packed = parseLocalDate(packedDate.value);
    document.getElementById("calculatedReminder").textContent = packed ? formatDate(addDays(packed, 14)) : "—";
    document.getElementById("calculatedRestock").textContent = packed ? formatDate(addDays(packed, 28)) : "—";
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

  function buildLabel(style, dates) {
    const label = document.createElement("div");
    label.className = `pickup-label ${style}`;
    const lines = style === "detailed"
      ? [["Packed", dates.packed], ["Remind", dates.reminder], ["Restock", dates.restock]]
      : [["Remind", dates.reminder], ["Restock", dates.restock]];
    lines.forEach(([name, value]) => {
      const line = document.createElement("div");
      line.className = "label-line";
      const labelName = document.createElement("span");
      labelName.textContent = `${name}:`;
      const labelValue = document.createElement("strong");
      labelValue.textContent = value;
      line.append(labelName, labelValue);
      label.appendChild(line);
    });
    return label;
  }

  function createSheet(template, startIndex, count, style, dates) {
    const sheet = document.createElement("section");
    sheet.className = "label-sheet";
    applyTemplateVariables(sheet, template);
    const capacity = template.columns * template.rows;
    let placed = 0;
    for (let slotIndex = 0; slotIndex < capacity; slotIndex += 1) {
      const slot = document.createElement("div");
      slot.className = "label-slot";
      if (slotIndex >= startIndex && placed < count) {
        slot.appendChild(buildLabel(style, dates));
        placed += 1;
      }
      sheet.appendChild(slot);
    }
    return { sheet, placed };
  }

  function clearPreview() {
    generatedLabelCount = 0;
    screenPreview.replaceChildren();
    printArea.replaceChildren();
    previewEmpty.classList.remove("d-none");
    printButton.disabled = true;
    newSheetButton.disabled = true;
    document.getElementById("sheetCount").textContent = "0 sheets";
    document.getElementById("totalGenerated").textContent = "0";
    showStatus();
  }

  function validateInputs() {
    const packed = parseLocalDate(packedDate.value);
    const count = Number(labelCount.value);
    if (!packed) throw new Error("Choose a valid packed date.");
    if (!Number.isInteger(count) || count < 1 || count > 500) throw new Error("Enter a whole number of labels between 1 and 500.");
    return { packed, count };
  }

  function generateLabels() {
    try {
      const { packed, count } = validateInputs();
      const template = currentTemplate();
      const style = selectedStyle();
      const startIndex = (Number(startingRow.value) - 1) * template.columns + (Number(startingColumn.value) - 1);
      const dates = {
        packed: formatDate(packed),
        reminder: formatDate(addDays(packed, 14)),
        restock: formatDate(addDays(packed, 28))
      };

      screenPreview.replaceChildren();
      printArea.replaceChildren();
      let remaining = count;
      let pageIndex = 0;
      let generated = 0;
      while (remaining > 0) {
        const pageStart = pageIndex === 0 ? startIndex : 0;
        const available = template.columns * template.rows - pageStart;
        const pageCount = Math.min(remaining, available);
        const screenSheet = createSheet(template, pageStart, pageCount, style, dates);
        const printSheet = createSheet(template, pageStart, pageCount, style, dates);
        screenPreview.appendChild(screenSheet.sheet);
        printArea.appendChild(printSheet.sheet);
        generated += screenSheet.placed;
        remaining -= screenSheet.placed;
        pageIndex += 1;
      }

      generatedLabelCount = generated;
      previewEmpty.classList.add("d-none");
      printButton.disabled = false;
      newSheetButton.disabled = false;
      document.getElementById("totalRequested").textContent = String(count);
      document.getElementById("totalGenerated").textContent = String(generated);
      document.getElementById("startingPosition").textContent = `Row ${startingRow.value}, Column ${startingColumn.value}`;
      document.getElementById("templateName").textContent = template.name;
      document.getElementById("sheetCount").textContent = `${pageIndex} ${pageIndex === 1 ? "sheet" : "sheets"}`;
      showStatus(`${generated} ${generated === 1 ? "label is" : "labels are"} ready to print.`, "success");
      return true;
    } catch (error) {
      clearPreview();
      showStatus(error.message, "error");
      return false;
    }
  }

  function resetApp() {
    form.reset();
    packedDate.value = localDateInputValue();
    labelCount.value = "10";
    labelTemplate.value = "avery5160";
    populatePositionOptions();
    startingRow.value = "1";
    startingColumn.value = "1";
    updateCalculatedDates();
    updateSummaryPosition();
    document.getElementById("totalRequested").textContent = "0";
    clearPreview();
  }

  function prepareAnotherSheet() {
    labelCount.value = "10";
    startingRow.value = "1";
    startingColumn.value = "1";
    updateSummaryPosition();
    clearPreview();
    labelCount.focus();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    generateLabels();
  });
  form.addEventListener("input", () => {
    updateCalculatedDates();
    if (generatedLabelCount) clearPreview();
  });
  labelTemplate.addEventListener("change", () => {
    populatePositionOptions();
    if (generatedLabelCount) clearPreview();
  });
  startingRow.addEventListener("change", updateSummaryPosition);
  startingColumn.addEventListener("change", updateSummaryPosition);
  document.getElementById("resetButton").addEventListener("click", resetApp);
  newSheetButton.addEventListener("click", prepareAnotherSheet);
  printButton.addEventListener("click", () => {
    if (!generatedLabelCount || !generateLabels()) return;
    window.print();
  });

  populateTemplateOptions();
  packedDate.value = localDateInputValue();
  populatePositionOptions();
  updateCalculatedDates();
})();
