(() => {
  const form = document.getElementById("signForm");
  const defaultRangeFields = document.getElementById("defaultRangeFields");
  const customRangeFields = document.getElementById("customRangeFields");
  const customRangeList = document.getElementById("customRangeList");
  const signType = document.getElementById("signType");
  const customHeaderField = document.getElementById("customHeaderField");
  const customHeader = document.getElementById("customHeader");
  const layoutType = document.getElementById("layoutType");
  const footerNote = document.getElementById("footerNote");
  const formStatus = document.getElementById("formStatus");
  const screenPreview = document.getElementById("screenPreview");
  const printArea = document.getElementById("printArea");
  const previewEmpty = document.getElementById("previewEmpty");
  const previewCount = document.getElementById("previewCount");
  const printButton = document.getElementById("printButton");
  const pageOrientation = document.getElementById("pageOrientation");

  let rangeRowId = 0;
  let generatedRanges = [];

  function currentMode() {
    return form.elements.rangeMode.value;
  }

  function positiveInteger(input) {
    const value = Number(input.value);
    return Number.isInteger(value) && value >= 0 ? value : null;
  }

  function showStatus(message = "", type = "") {
    formStatus.textContent = message;
    formStatus.className = `form-status mt-4${type ? ` ${type}` : ""}`;
  }

  function clearGeneratedPreview() {
    if (!generatedRanges.length) return;
    generatedRanges = [];
    screenPreview.replaceChildren();
    printArea.replaceChildren();
    previewEmpty.classList.remove("d-none");
    previewCount.textContent = "0 signs";
    printButton.disabled = true;
    showStatus();
  }

  function addCustomRange(start = "", end = "") {
    rangeRowId += 1;
    const row = document.createElement("div");
    row.className = "custom-range-row";
    row.dataset.rangeId = String(rangeRowId);
    row.innerHTML = `
      <div class="range-field">
        <label class="form-label" for="customStart${rangeRowId}">Start Number</label>
        <input class="form-control custom-start" id="customStart${rangeRowId}" type="number" min="0" step="1" inputmode="numeric" value="${start}">
      </div>
      <div class="range-field">
        <label class="form-label" for="customEnd${rangeRowId}">End Number</label>
        <input class="form-control custom-end" id="customEnd${rangeRowId}" type="number" min="0" step="1" inputmode="numeric" value="${end}">
      </div>
      <button class="btn btn-outline-secondary remove-range" type="button" aria-label="Remove range"><i class="fa-solid fa-trash" aria-hidden="true"></i></button>
    `;
    row.querySelector(".remove-range").addEventListener("click", () => {
      row.remove();
      if (!customRangeList.children.length) addCustomRange();
      clearGeneratedPreview();
    });
    customRangeList.appendChild(row);
  }

  function updateMode() {
    const isDefault = currentMode() === "default";
    defaultRangeFields.classList.toggle("d-none", !isDefault);
    customRangeFields.classList.toggle("d-none", isDefault);
    showStatus();
  }

  function updateSignType() {
    const isCustom = signType.value === "custom";
    customHeaderField.classList.toggle("d-none", !isCustom);
    customHeader.required = isCustom;
  }

  function buildDefaultRanges() {
    const start = positiveInteger(document.getElementById("startOrder"));
    const end = positiveInteger(document.getElementById("endOrder"));
    const perSign = positiveInteger(document.getElementById("ordersPerSign"));

    if (start === null || end === null || perSign === null || perSign < 1) {
      throw new Error("Enter valid whole numbers for the starting order, ending order, and orders per sign.");
    }
    if (end < start) throw new Error("The ending order number must be equal to or greater than the starting order number.");

    const ranges = [];
    for (let rangeStart = start; rangeStart <= end; rangeStart += perSign) {
      ranges.push({ start: rangeStart, end: Math.min(rangeStart + perSign - 1, end) });
    }
    return ranges;
  }

  function buildCustomRanges() {
    const rows = [...customRangeList.querySelectorAll(".custom-range-row")];
    const ranges = rows.map((row, index) => {
      const start = positiveInteger(row.querySelector(".custom-start"));
      const end = positiveInteger(row.querySelector(".custom-end"));
      if (start === null || end === null) throw new Error(`Enter both whole numbers for custom range ${index + 1}.`);
      if (end < start) throw new Error(`Custom range ${index + 1} must end at or after its starting number.`);
      return { start, end };
    });
    if (!ranges.length) throw new Error("Add at least one custom range.");
    return ranges;
  }

  function selectedHeader() {
    if (signType.value !== "custom") return signType.value;
    const value = customHeader.value.trim();
    if (!value) throw new Error("Enter custom header text for the selected Custom sign type.");
    return value.toUpperCase();
  }

  function signMarkup(range, header, note) {
    const sign = document.createElement("article");
    sign.className = "range-sign";
    sign.innerHTML = `
      <div class="range-sign-content">
        <h3 class="range-sign-header"></h3>
        <div class="range-sign-number range-start"></div>
        <div class="range-sign-through">through</div>
        <div class="range-sign-number range-end"></div>
        <p class="range-sign-footer"></p>
      </div>
      <img class="range-sign-logo" src="../Bookstore-VPSA-CSU-HBlk.png" alt="CSU Bookstore">
    `;
    sign.querySelector(".range-sign-header").textContent = header;
    sign.querySelector(".range-start").textContent = range.start;
    sign.querySelector(".range-end").textContent = range.end;
    sign.querySelector(".range-sign-footer").textContent = note;
    return sign;
  }

  function renderPages(ranges, header, note) {
    const layout = layoutType.value;
    const perPage = layout === "shelf" ? 4 : 1;
    screenPreview.replaceChildren();
    printArea.replaceChildren();
    pageOrientation.textContent = `@page { size: letter ${layout === "shelf" ? "portrait" : "landscape"}; margin: ${layout === "shelf" ? "0.25in" : "0.25in"}; }`;

    for (let index = 0; index < ranges.length; index += perPage) {
      const group = ranges.slice(index, index + perPage);
      const screenPage = document.createElement("div");
      screenPage.className = `screen-page ${layout}`;
      const printPage = document.createElement("section");
      printPage.className = `print-page ${layout}`;
      group.forEach((range) => {
        screenPage.appendChild(signMarkup(range, header, note));
        printPage.appendChild(signMarkup(range, header, note));
      });
      screenPreview.appendChild(screenPage);
      printArea.appendChild(printPage);
    }

    previewEmpty.classList.add("d-none");
    previewCount.textContent = `${ranges.length} ${ranges.length === 1 ? "sign" : "signs"}`;
    printButton.disabled = false;
  }

  function generateSigns() {
    try {
      const ranges = currentMode() === "default" ? buildDefaultRanges() : buildCustomRanges();
      const header = selectedHeader();
      generatedRanges = ranges;
      renderPages(ranges, header, footerNote.value.trim());
      showStatus(`${ranges.length} ${ranges.length === 1 ? "sign is" : "signs are"} ready to print.`, "success");
      return true;
    } catch (error) {
      generatedRanges = [];
      printButton.disabled = true;
      showStatus(error.message, "error");
      return false;
    }
  }

  function resetApp() {
    form.reset();
    customRangeList.replaceChildren();
    addCustomRange();
    generatedRanges = [];
    screenPreview.replaceChildren();
    printArea.replaceChildren();
    previewEmpty.classList.remove("d-none");
    previewCount.textContent = "0 signs";
    printButton.disabled = true;
    updateMode();
    updateSignType();
    showStatus();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    generateSigns();
  });
  form.addEventListener("input", clearGeneratedPreview);
  [...form.elements.rangeMode].forEach((radio) => radio.addEventListener("change", updateMode));
  signType.addEventListener("change", updateSignType);
  document.getElementById("addRangeButton").addEventListener("click", () => addCustomRange());
  document.getElementById("resetButton").addEventListener("click", resetApp);
  printButton.addEventListener("click", () => {
    if (!generatedRanges.length || !generateSigns()) return;
    window.print();
  });

  addCustomRange();
  updateMode();
  updateSignType();
})();
