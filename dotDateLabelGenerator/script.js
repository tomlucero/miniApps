(() => {
  // Adjust only this object after a physical test print if alignment needs tuning.
  const DOT_LABEL_TEMPLATE = {
    id: "uline-s10415",
    name: "ULINE S-10415P / S-10415",
    pageWidth: 8.5,
    pageHeight: 11,
    columns: 7,
    rows: 9,
    labelDiameter: 1,
    marginTop: 0.5,
    marginLeft: 0.375,
    columnGap: 0.125,
    rowGap: 0.125
  };

  const form = document.getElementById("labelForm");
  const labelDate = document.getElementById("labelDate");
  const labelCount = document.getElementById("labelCount");
  const startingRow = document.getElementById("startingRow");
  const startingColumn = document.getElementById("startingColumn");
  const formStatus = document.getElementById("formStatus");
  const screenPreview = document.getElementById("screenPreview");
  const printArea = document.getElementById("printArea");

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
    if (Number.isNaN(date.getTime())) return null;
    if (date.getFullYear() !== parts[0] || date.getMonth() !== parts[1] - 1 || date.getDate() !== parts[2]) return null;
    return date;
  }

  function formatCompactDate(date) {
    return `${date.getMonth() + 1}/${date.getDate()}/${String(date.getFullYear()).slice(-2)}`;
  }

  function showStatus(message = "", type = "") {
    formStatus.textContent = message;
    formStatus.className = `form-status mt-3${type ? ` ${type}` : ""}`;
  }

  function populatePositionOptions() {
    startingRow.replaceChildren();
    startingColumn.replaceChildren();
    for (let row = 1; row <= DOT_LABEL_TEMPLATE.rows; row += 1) {
      startingRow.add(new Option(`Row ${row}`, String(row)));
    }
    for (let column = 1; column <= DOT_LABEL_TEMPLATE.columns; column += 1) {
      startingColumn.add(new Option(`Column ${column}`, String(column)));
    }
  }

  function templateCapacity() {
    return DOT_LABEL_TEMPLATE.columns * DOT_LABEL_TEMPLATE.rows;
  }

  function validateInputs() {
    const date = parseLocalDate(labelDate.value);
    const count = Number(labelCount.value);
    const row = Number(startingRow.value);
    const column = Number(startingColumn.value);
    if (!date) throw new Error("Choose a valid date.");
    if (!Number.isInteger(count) || count < 1 || count > 500) throw new Error("Enter a whole number of labels between 1 and 500.");
    if (!Number.isInteger(row) || row < 1 || row > DOT_LABEL_TEMPLATE.rows) throw new Error("Choose a valid starting row.");
    if (!Number.isInteger(column) || column < 1 || column > DOT_LABEL_TEMPLATE.columns) throw new Error("Choose a valid starting column.");
    return { date, count, row, column };
  }

  function applyTemplateVariables(sheet) {
    const template = DOT_LABEL_TEMPLATE;
    const values = {
      "--page-width": `${template.pageWidth}in`,
      "--page-height": `${template.pageHeight}in`,
      "--page-aspect": template.pageWidth / template.pageHeight,
      "--columns": template.columns,
      "--rows": template.rows,
      "--label-diameter": `${template.labelDiameter}in`,
      "--margin-top": `${template.marginTop}in`,
      "--margin-left": `${template.marginLeft}in`,
      "--column-gap": `${template.columnGap}in`,
      "--row-gap": `${template.rowGap}in`,
      "--preview-label-width": `${(template.labelDiameter / template.pageWidth) * 100}%`,
      "--preview-label-height": `${(template.labelDiameter / template.pageHeight) * 100}%`,
      "--preview-margin-top": `${(template.marginTop / template.pageHeight) * 100}%`,
      "--preview-margin-left": `${(template.marginLeft / template.pageWidth) * 100}%`,
      "--preview-column-gap": `${(template.columnGap / template.pageWidth) * 100}%`,
      "--preview-row-gap": `${(template.rowGap / template.pageHeight) * 100}%`
    };
    Object.entries(values).forEach(([property, value]) => sheet.style.setProperty(property, value));
  }

  function createSheet(startIndex, count, dateText) {
    const sheet = document.createElement("section");
    sheet.className = "dot-sheet";
    applyTemplateVariables(sheet);

    let placed = 0;
    for (let slotIndex = 0; slotIndex < templateCapacity(); slotIndex += 1) {
      const slot = document.createElement("div");
      slot.className = "dot-slot";
      if (slotIndex >= startIndex && placed < count) {
        slot.classList.add("filled");
        slot.textContent = dateText;
        placed += 1;
      }
      sheet.appendChild(slot);
    }
    return { sheet, placed };
  }

  function renderLabels({ announce = false } = {}) {
    try {
      const { date, count, row, column } = validateInputs();
      const dateText = formatCompactDate(date);
      const startIndex = (row - 1) * DOT_LABEL_TEMPLATE.columns + (column - 1);

      screenPreview.replaceChildren();
      printArea.replaceChildren();
      let remaining = count;
      let pageIndex = 0;
      let generated = 0;
      while (remaining > 0) {
        const pageStart = pageIndex === 0 ? startIndex : 0;
        const available = templateCapacity() - pageStart;
        const pageCount = Math.min(remaining, available);
        const screenSheet = createSheet(pageStart, pageCount, dateText);
        const printSheet = createSheet(pageStart, pageCount, dateText);
        screenPreview.appendChild(screenSheet.sheet);
        printArea.appendChild(printSheet.sheet);
        generated += screenSheet.placed;
        remaining -= screenSheet.placed;
        pageIndex += 1;
      }

      document.getElementById("totalRequested").textContent = String(count);
      document.getElementById("totalGenerated").textContent = String(generated);
      document.getElementById("startingPosition").textContent = `Row ${row}, Column ${column}`;
      document.getElementById("sheetCount").textContent = `${pageIndex} ${pageIndex === 1 ? "sheet" : "sheets"}`;
      showStatus(announce ? `${generated} ${generated === 1 ? "label is" : "labels are"} ready to print.` : "", announce ? "success" : "");
      return true;
    } catch (error) {
      screenPreview.replaceChildren();
      printArea.replaceChildren();
      document.getElementById("totalGenerated").textContent = "0";
      document.getElementById("sheetCount").textContent = "0 sheets";
      showStatus(error.message, "error");
      return false;
    }
  }

  function resetApp() {
    labelDate.value = localDateInputValue();
    labelCount.value = "20";
    startingRow.value = "1";
    startingColumn.value = "1";
    renderLabels();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    renderLabels({ announce: true });
  });
  form.addEventListener("input", () => renderLabels());
  form.addEventListener("change", () => renderLabels());
  document.getElementById("resetButton").addEventListener("click", resetApp);
  document.getElementById("printButton").addEventListener("click", () => {
    if (renderLabels({ announce: true })) window.print();
  });

  populatePositionOptions();
  resetApp();
})();
