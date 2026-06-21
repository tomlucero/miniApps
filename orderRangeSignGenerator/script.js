(() => {
  const form = document.getElementById("signForm");
  const defaultRangeFields = document.getElementById("defaultRangeFields");
  const rackAllocationFields = document.getElementById("rackAllocationFields");
  const rackEndingRule = document.getElementById("rackEndingRule");
  const rackAllocationDescription = document.getElementById("rackAllocationDescription");
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
    if (!input) return null;
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
    const mode = currentMode();
    const isDefault = mode === "default";
    const isRackAllocation = mode === "rack-allocation";
    defaultRangeFields.classList.toggle("d-none", !isDefault);
    rackAllocationFields.classList.toggle("d-none", !isRackAllocation);
    customRangeFields.classList.toggle("d-none", mode !== "custom");
    showStatus();
  }

  function updateRackEndingRule() {
    rackAllocationDescription.textContent = rackEndingRule.value === "require-99"
      ? "Rack boundaries end in 99."
      : "Rack boundaries count forward from the starting order.";
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

  function buildRackAllocationRanges() {
    const start = positiveInteger(document.getElementById("rackStartOrder"));
    const rackCount = positiveInteger(document.getElementById("rackCount"));
    const shelvesPerRack = positiveInteger(document.getElementById("shelvesPerRack"));
    const ordersPerRack = positiveInteger(document.getElementById("ordersPerRack"));
    const endingRule = rackEndingRule.value;

    if (start === null || start < 1 || rackCount === null || rackCount < 1 || shelvesPerRack === null || shelvesPerRack < 1 || ordersPerRack === null || ordersPerRack < 1) {
      throw new Error("Enter valid whole numbers for the starting order, racks, shelves, and orders per rack.");
    }
    if (endingRule === "require-99" && ordersPerRack % 100 !== 0) {
      throw new Error("Orders per rack must be a multiple of 100 to keep every rack on the same preferred ending digits.");
    }

    let firstRackEnd;
    if (endingRule === "require-99") {
      const firstEndingBase = Math.floor(start / 100) * 100;
      firstRackEnd = firstEndingBase + 99;
      if (firstRackEnd < start) firstRackEnd += 100;
    } else {
      firstRackEnd = start + ordersPerRack - 1;
    }
    const firstRackSize = firstRackEnd - start + 1;
    if (firstRackSize > ordersPerRack) {
      throw new Error("The starting order is too far from the next preferred rack ending for the configured rack capacity.");
    }

    const ranges = [];
    let rackStart = start;
    let rackEnd = firstRackEnd;

    for (let rackIndex = 0; rackIndex < rackCount; rackIndex += 1) {
      const rackSize = rackEnd - rackStart + 1;
      if (shelvesPerRack > rackSize) {
        throw new Error(`Rack ${rackIndex + 1} has fewer orders than shelves. Reduce the shelves per rack.`);
      }

      const shelfSizes = symmetricShelfSizes(rackSize, shelvesPerRack);
      let shelfStart = rackStart;
      shelfSizes.forEach((shelfSize) => {
        const shelfEnd = shelfStart + shelfSize - 1;
        ranges.push({ start: shelfStart, end: shelfEnd });
        shelfStart = shelfEnd + 1;
      });

      rackStart = rackEnd + 1;
      rackEnd += ordersPerRack;
    }

    return ranges;
  }

  function symmetricShelfSizes(totalOrders, shelfCount) {
    if (shelfCount === 1) return [totalOrders];
    if (shelfCount === 2) return [Math.ceil(totalOrders / 2), Math.floor(totalOrders / 2)];

    const minimumInteriorOrders = shelfCount - 2;
    const preferredOuterSize = Math.ceil(totalOrders / shelfCount);
    const outerSize = Math.min(preferredOuterSize, Math.floor((totalOrders - minimumInteriorOrders) / 2));
    const interiorCount = shelfCount - 2;
    const interiorTotal = totalOrders - (outerSize * 2);
    const interiorBase = Math.floor(interiorTotal / interiorCount);
    let interiorRemainder = interiorTotal % interiorCount;
    const interiorSizes = Array(interiorCount).fill(interiorBase);

    for (let offset = 0; interiorRemainder > 0; offset += 1) {
      const leftIndex = offset;
      const rightIndex = interiorCount - 1 - offset;
      interiorSizes[leftIndex] += 1;
      interiorRemainder -= 1;
      if (interiorRemainder > 0 && rightIndex !== leftIndex) {
        interiorSizes[rightIndex] += 1;
        interiorRemainder -= 1;
      }
    }

    return [outerSize, ...interiorSizes, outerSize];
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
      const mode = currentMode();
      const ranges = mode === "default"
        ? buildDefaultRanges()
        : mode === "rack-allocation"
          ? buildRackAllocationRanges()
          : buildCustomRanges();
      const header = selectedHeader();
      generatedRanges = ranges;
      renderPages(ranges, header, footerNote.value.trim());
      const rackTotal = Number(document.getElementById("rackCount").value);
      const readyMessage = mode === "rack-allocation"
        ? `${ranges.length} ${ranges.length === 1 ? "sign" : "signs"} across ${rackTotal} ${rackTotal === 1 ? "rack" : "racks"} ${ranges.length === 1 ? "is" : "are"} ready to print.`
        : `${ranges.length} ${ranges.length === 1 ? "sign is" : "signs are"} ready to print.`;
      showStatus(readyMessage, "success");
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
    updateRackEndingRule();
    updateSignType();
    showStatus();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    generateSigns();
  });
  form.addEventListener("input", clearGeneratedPreview);
  [...form.elements.rangeMode].forEach((radio) => radio.addEventListener("change", updateMode));
  rackEndingRule.addEventListener("change", updateRackEndingRule);
  signType.addEventListener("change", updateSignType);
  document.getElementById("addRangeButton").addEventListener("click", () => addCustomRange());
  document.getElementById("resetButton").addEventListener("click", resetApp);
  printButton.addEventListener("click", () => {
    if (!generatedRanges.length || !generateSigns()) return;
    window.print();
  });

  addCustomRange();
  updateMode();
  updateRackEndingRule();
  updateSignType();
})();
