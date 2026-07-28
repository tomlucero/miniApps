const form = document.querySelector("#labelForm");
const printArea = document.querySelector("#printArea");
const labelList = document.querySelector("#labelList");
const sheetSummary = document.querySelector("#sheetSummary");
const formWarning = document.querySelector("#formWarning");
const resetButton = document.querySelector("#resetButton");
const printButton = document.querySelector("#printButton");
const copyButton = document.querySelector("#copyButton");

const AVERY_5266_TEMPLATE = {
  columns: 2,
  rows: 15,
  labelsPerSheet: 30,
};

const defaults = {
  startNumber: 210000,
  groupSize: 50,
  labelCount: 30,
  startingRow: 1,
  startingColumn: 1,
  prefixText: "",
  suffixText: "",
  fontSize: 14,
  fontWeight: "700",
  alignText: "center",
  showGuides: "yes",
  topOffset: 0,
  leftOffset: 0,
};

function getFieldValue(name) {
  return form.elements[name].value.trim();
}

function getNumberField(name, fallback) {
  const value = Number(getFieldValue(name));
  return Number.isFinite(value) ? value : fallback;
}

function padNumber(value, width) {
  return String(value).padStart(width, "0");
}

function buildLabelText(range, prefix, suffix) {
  return [prefix, range, suffix].filter(Boolean).join(" ");
}

function populatePositionOptions() {
  const startingRow = form.elements.startingRow;
  const startingColumn = form.elements.startingColumn;

  startingRow.replaceChildren();
  startingColumn.replaceChildren();

  for (let row = 1; row <= AVERY_5266_TEMPLATE.rows; row += 1) {
    startingRow.add(new Option(`Row ${row}`, String(row)));
  }

  for (let column = 1; column <= AVERY_5266_TEMPLATE.columns; column += 1) {
    startingColumn.add(new Option(`Column ${column}`, String(column)));
  }
}

function getFormData() {
  const startNumber = Math.max(0, Math.floor(getNumberField("startNumber", defaults.startNumber)));
  const groupSize = Math.max(1, Math.floor(getNumberField("groupSize", defaults.groupSize)));
  const labelCount = Math.min(300, Math.max(1, Math.floor(getNumberField("labelCount", defaults.labelCount))));
  const startingRow = Math.min(AVERY_5266_TEMPLATE.rows, Math.max(1, Math.floor(getNumberField("startingRow", defaults.startingRow))));
  const startingColumn = Math.min(AVERY_5266_TEMPLATE.columns, Math.max(1, Math.floor(getNumberField("startingColumn", defaults.startingColumn))));
  const firstPosition = (startingRow - 1) * AVERY_5266_TEMPLATE.columns + startingColumn;

  return {
    startNumber,
    groupSize,
    labelCount,
    startingRow,
    startingColumn,
    firstPosition,
    prefixText: getFieldValue("prefixText"),
    suffixText: getFieldValue("suffixText"),
    fontSize: Math.min(24, Math.max(8, Math.floor(getNumberField("fontSize", defaults.fontSize)))),
    fontWeight: getFieldValue("fontWeight") || defaults.fontWeight,
    alignText: getFieldValue("alignText") || defaults.alignText,
    showGuides: getFieldValue("showGuides") || defaults.showGuides,
    topOffset: getNumberField("topOffset", defaults.topOffset),
    leftOffset: getNumberField("leftOffset", defaults.leftOffset),
  };
}

function buildLabels(data) {
  const width = String(data.startNumber).length;

  return Array.from({ length: data.labelCount }, (_, index) => {
    const rangeStart = data.startNumber + index * data.groupSize;
    const rangeEnd = rangeStart + data.groupSize - 1;
    const range = `${padNumber(rangeStart, width)} - ${padNumber(rangeEnd, width)}`;

    return buildLabelText(range, data.prefixText, data.suffixText);
  });
}

function makeElement(tagName, className, text) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text) {
    element.textContent = text;
  }

  return element;
}

function renderSheets(labels, data) {
  printArea.innerHTML = "";
  printArea.classList.toggle("show-guides", data.showGuides === "yes");
  printArea.style.setProperty("--label-font-size", `${data.fontSize}pt`);
  printArea.style.setProperty("--label-font-weight", data.fontWeight);
  printArea.style.setProperty("--label-text-align", data.alignText);
  printArea.style.setProperty("--top-offset", `${data.topOffset}in`);
  printArea.style.setProperty("--left-offset", `${data.leftOffset}in`);

  const totalPositions = data.firstPosition - 1 + labels.length;
  const sheetCount = Math.max(1, Math.ceil(totalPositions / AVERY_5266_TEMPLATE.labelsPerSheet));

  for (let sheetIndex = 0; sheetIndex < sheetCount; sheetIndex += 1) {
    const sheet = makeElement("section", "label-sheet");
    sheet.setAttribute("aria-label", `Label sheet ${sheetIndex + 1}`);

    const grid = makeElement("div", "label-grid");

    for (let position = 1; position <= AVERY_5266_TEMPLATE.labelsPerSheet; position += 1) {
      const absolutePosition = sheetIndex * AVERY_5266_TEMPLATE.labelsPerSheet + position;
      const labelIndex = absolutePosition - data.firstPosition;
      const labelText = labels[labelIndex] || "";
      const alignClass = data.alignText === "left" ? " align-left" : data.alignText === "right" ? " align-right" : "";
      const cell = makeElement("div", `label-cell${alignClass}`);

      if (labelText) {
        cell.textContent = labelText;
      } else if (absolutePosition < data.firstPosition) {
        cell.textContent = "blank";
        cell.classList.add("empty-label");
      }

      grid.appendChild(cell);
    }

    sheet.appendChild(grid);
    printArea.appendChild(sheet);
  }

  sheetSummary.textContent = `${sheetCount} ${sheetCount === 1 ? "sheet" : "sheets"}, ${labels.length} ${labels.length === 1 ? "label" : "labels"}, starting at row ${data.startingRow}, column ${data.startingColumn}.`;
}

function validate(data) {
  const messages = [];

  if (!Number.isInteger(data.startNumber) || data.startNumber < 0) {
    messages.push("Starting Number must be zero or higher.");
  }

  if (!Number.isInteger(data.groupSize) || data.groupSize < 1) {
    messages.push("Numbers Per Label must be at least 1.");
  }

  if (!Number.isInteger(data.labelCount) || data.labelCount < 1 || data.labelCount > 300) {
    messages.push("Number of Labels must be between 1 and 300.");
  }

  if (!Number.isInteger(data.startingRow) || data.startingRow < 1 || data.startingRow > AVERY_5266_TEMPLATE.rows) {
    messages.push("Starting Row must be between 1 and 15.");
  }

  if (!Number.isInteger(data.startingColumn) || data.startingColumn < 1 || data.startingColumn > AVERY_5266_TEMPLATE.columns) {
    messages.push("Starting Column must be 1 or 2.");
  }

  return messages;
}

function updateApp() {
  const data = getFormData();
  const messages = validate(data);
  const labels = buildLabels(data);

  formWarning.textContent = messages.join(" ");
  printButton.disabled = messages.length > 0;
  copyButton.disabled = messages.length > 0;

  labelList.value = labels.join("\n");
  renderSheets(labels, data);
}

async function copyLabelList() {
  try {
    await navigator.clipboard.writeText(labelList.value);
    copyButton.textContent = "Copied";
    window.setTimeout(() => {
      copyButton.textContent = "Copy Label List";
    }, 1400);
  } catch (error) {
    labelList.focus();
    labelList.select();
    document.execCommand("copy");
  }
}

function resetForm() {
  Object.entries(defaults).forEach(([name, value]) => {
    form.elements[name].value = value;
  });

  updateApp();
}

form.addEventListener("input", updateApp);
form.addEventListener("change", updateApp);
resetButton.addEventListener("click", resetForm);
printButton.addEventListener("click", () => window.print());
copyButton.addEventListener("click", copyLabelList);

populatePositionOptions();
updateApp();
