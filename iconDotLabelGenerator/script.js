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

  const ICON_OPTIONS = [
    { id: "warning", name: "Warning", className: "fa-solid fa-triangle-exclamation" },
    { id: "alert", name: "Alert", className: "fa-solid fa-circle-exclamation" },
    { id: "checkmark", name: "Checkmark", className: "fa-solid fa-check" },
    { id: "football", name: "Football", className: "fa-solid fa-football" },
    { id: "camera", name: "Take Photo", className: "fa-solid fa-camera" },
    { id: "ram-head", name: "CSU Ram Head", className: "fa-kit fa-csuramhead" }
  ];

  const ICON_SIZES = {
    small: "0.38in",
    medium: "0.5in",
    large: "0.62in"
  };

  const form = document.getElementById("labelForm");
  const iconChoice = document.getElementById("iconChoice");
  const labelCount = document.getElementById("labelCount");
  const iconSize = document.getElementById("iconSize");
  const startingRow = document.getElementById("startingRow");
  const startingColumn = document.getElementById("startingColumn");
  const formStatus = document.getElementById("formStatus");
  const screenPreview = document.getElementById("screenPreview");
  const printArea = document.getElementById("printArea");

  function showStatus(message = "", type = "") {
    formStatus.textContent = message;
    formStatus.className = `form-status mt-3${type ? ` ${type}` : ""}`;
  }

  function populateIconOptions() {
    iconChoice.replaceChildren();
    ICON_OPTIONS.forEach((icon) => {
      const option = document.createElement("option");
      option.value = icon.id;
      option.textContent = icon.name;
      iconChoice.appendChild(option);
    });
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

  function selectedIcon() {
    return ICON_OPTIONS.find((icon) => icon.id === iconChoice.value) || ICON_OPTIONS[0];
  }

  function validateInputs() {
    const count = Number(labelCount.value);
    const row = Number(startingRow.value);
    const column = Number(startingColumn.value);
    if (!Number.isInteger(count) || count < 1 || count > 500) throw new Error("Enter a whole number of labels between 1 and 500.");
    if (!Number.isInteger(row) || row < 1 || row > DOT_LABEL_TEMPLATE.rows) throw new Error("Choose a valid starting row.");
    if (!Number.isInteger(column) || column < 1 || column > DOT_LABEL_TEMPLATE.columns) throw new Error("Choose a valid starting column.");
    return { count, row, column };
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

  function buildIconLabel(icon) {
    const wrapper = document.createElement("div");
    wrapper.className = "dot-icon";
    wrapper.setAttribute("aria-label", icon.name);
    wrapper.style.setProperty("--icon-size", ICON_SIZES[iconSize.value] || ICON_SIZES.medium);

    const iconElement = document.createElement("i");
    iconElement.className = icon.className;
    iconElement.setAttribute("aria-hidden", "true");
    wrapper.appendChild(iconElement);
    return wrapper;
  }

  function createSheet(startIndex, count, icon) {
    const sheet = document.createElement("section");
    sheet.className = "dot-sheet";
    applyTemplateVariables(sheet);

    let placed = 0;
    for (let slotIndex = 0; slotIndex < templateCapacity(); slotIndex += 1) {
      const slot = document.createElement("div");
      slot.className = "dot-slot";
      if (slotIndex >= startIndex && placed < count) {
        slot.classList.add("filled");
        slot.appendChild(buildIconLabel(icon));
        placed += 1;
      }
      sheet.appendChild(slot);
    }
    return { sheet, placed };
  }

  function renderLabels({ announce = false } = {}) {
    try {
      const { count, row, column } = validateInputs();
      const icon = selectedIcon();
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
        const screenSheet = createSheet(pageStart, pageCount, icon);
        const printSheet = createSheet(pageStart, pageCount, icon);
        screenPreview.appendChild(screenSheet.sheet);
        printArea.appendChild(printSheet.sheet);
        generated += screenSheet.placed;
        remaining -= screenSheet.placed;
        pageIndex += 1;
      }

      document.getElementById("totalRequested").textContent = String(count);
      document.getElementById("totalGenerated").textContent = String(generated);
      document.getElementById("startingPosition").textContent = `Row ${row}, Column ${column}`;
      document.getElementById("selectedIconName").textContent = icon.name;
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
    iconChoice.value = ICON_OPTIONS[0].id;
    labelCount.value = "9";
    iconSize.value = "medium";
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

  populateIconOptions();
  populatePositionOptions();
  resetApp();
})();
