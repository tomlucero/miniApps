(() => {
  const DEFAULT_ROWS = 10;
  const EXAMPLE_TAX = "1.56";
  const EXAMPLE_ITEMS = [
    { description: "Example item 1", price: "6.00" },
    { description: "Example item 2", price: "13.50" }
  ];

  const totalTaxInput = document.getElementById("totalTax");
  const itemsBody = document.getElementById("itemsBody");
  const addRowButton = document.getElementById("addRowButton");
  const loadExampleButton = document.getElementById("loadExampleButton");
  const copyButton = document.getElementById("copyButton");
  const resetButton = document.getElementById("resetButton");
  const formStatus = document.getElementById("formStatus");

  const summaryNodes = {
    activeItemCount: document.getElementById("activeItemCount"),
    subtotalValue: document.getElementById("subtotalValue"),
    allocatedTaxValue: document.getElementById("allocatedTaxValue"),
    grandTotalValue: document.getElementById("grandTotalValue"),
    allocationCheck: document.getElementById("allocationCheck"),
    allocationNote: document.getElementById("allocationNote"),
    checkCard: document.getElementById("checkCard"),
    tableSubtotal: document.getElementById("tableSubtotal"),
    tableAllocatedTax: document.getElementById("tableAllocatedTax"),
    tableGrandTotal: document.getElementById("tableGrandTotal")
  };

  function money(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(value);
  }

  function roundToCents(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function sanitizeCurrencyInput(value) {
    const cleaned = value.replace(/[^0-9.-]/g, "");
    if (!cleaned || cleaned === "-" || cleaned === "." || cleaned === "-.") return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function formatMoneyForField(value) {
    return Number.isFinite(value) ? roundToCents(value).toFixed(2) : "";
  }

  function showStatus(message = "", type = "") {
    formStatus.textContent = message;
    formStatus.className = `form-status mt-3${type ? ` ${type}` : ""}`;
  }

  function createRow(description = "", price = "") {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="row-number"></td>
      <td><input class="form-control description-input" type="text" maxlength="120" placeholder="Optional description"></td>
      <td><input class="form-control price-cell" type="text" inputmode="decimal" placeholder="0.00" aria-label="Item price"></td>
      <td class="readonly-money empty-money" data-role="allocation">--</td>
      <td class="readonly-money empty-money" data-role="item-total">--</td>
      <td><button class="btn btn-outline-secondary table-remove" type="button" aria-label="Remove row"><i class="fa-solid fa-trash" aria-hidden="true"></i></button></td>
    `;

    const descriptionInput = row.querySelector(".description-input");
    const priceInput = row.querySelector(".price-cell");
    const removeButton = row.querySelector(".table-remove");

    descriptionInput.value = description;
    priceInput.value = price;

    descriptionInput.addEventListener("input", updateWorksheet);
    priceInput.addEventListener("input", updateWorksheet);
    priceInput.addEventListener("blur", () => {
      const parsed = sanitizeCurrencyInput(priceInput.value);
      priceInput.value = parsed === null ? priceInput.value.trim() : formatMoneyForField(parsed);
      updateWorksheet();
    });
    removeButton.addEventListener("click", () => {
      if (itemsBody.children.length <= 1) {
        descriptionInput.value = "";
        priceInput.value = "";
      } else {
        row.remove();
      }
      updateWorksheet();
    });

    itemsBody.appendChild(row);
  }

  function getRows() {
    return Array.from(itemsBody.querySelectorAll("tr"));
  }

  function rowData(row) {
    const description = row.querySelector(".description-input").value.trim();
    const priceRaw = row.querySelector(".price-cell").value.trim();
    const price = sanitizeCurrencyInput(priceRaw);
    const hasPrice = price !== null;
    return { description, priceRaw, price, hasPrice };
  }

  function updateRowNumbers() {
    getRows().forEach((row, index) => {
      row.querySelector(".row-number").textContent = index + 1;
    });
  }

  function setMoneyCell(cell, value, isBlank) {
    if (isBlank) {
      cell.textContent = "--";
      cell.classList.add("empty-money");
      return;
    }
    cell.textContent = money(value);
    cell.classList.remove("empty-money");
  }

  function calculateAllocations(totalTax, activeRows) {
    const subtotal = roundToCents(activeRows.reduce((sum, row) => sum + row.price, 0));
    if (!activeRows.length) {
      return { subtotal, allocations: [] };
    }

    if (subtotal === 0 || totalTax === 0) {
      return {
        subtotal,
        allocations: activeRows.map(() => 0)
      };
    }

    const allocations = [];
    let allocatedSoFar = 0;

    activeRows.forEach((row, index) => {
      const isLast = index === activeRows.length - 1;
      const value = isLast
        ? roundToCents(totalTax - allocatedSoFar)
        : roundToCents((totalTax * row.price) / subtotal);
      allocations.push(value);
      allocatedSoFar = roundToCents(allocatedSoFar + value);
    });

    return { subtotal, allocations };
  }

  function updateWorksheet() {
    updateRowNumbers();

    const totalTax = sanitizeCurrencyInput(totalTaxInput.value) ?? 0;
    const rows = getRows();
    const data = rows.map((row) => ({ row, ...rowData(row) }));
    const activeRows = data.filter(({ hasPrice }) => hasPrice);
    const { subtotal, allocations } = calculateAllocations(totalTax, activeRows);

    let allocatedTax = 0;
    activeRows.forEach((item, index) => {
      const allocation = allocations[index];
      const total = roundToCents(item.price + allocation);
      const allocationCell = item.row.querySelector('[data-role="allocation"]');
      const totalCell = item.row.querySelector('[data-role="item-total"]');
      setMoneyCell(allocationCell, allocation, false);
      setMoneyCell(totalCell, total, false);
      allocatedTax = roundToCents(allocatedTax + allocation);
    });

    data.filter(({ hasPrice }) => !hasPrice).forEach(({ row }) => {
      setMoneyCell(row.querySelector('[data-role="allocation"]'), 0, true);
      setMoneyCell(row.querySelector('[data-role="item-total"]'), 0, true);
    });

    const grandTotal = roundToCents(subtotal + allocatedTax);
    const difference = roundToCents(totalTax - allocatedTax);
    const hasMismatch = Math.abs(difference) >= 0.01;

    summaryNodes.activeItemCount.textContent = String(activeRows.length);
    summaryNodes.subtotalValue.textContent = money(subtotal);
    summaryNodes.allocatedTaxValue.textContent = money(allocatedTax);
    summaryNodes.grandTotalValue.textContent = money(grandTotal);
    summaryNodes.tableSubtotal.textContent = money(subtotal);
    summaryNodes.tableAllocatedTax.textContent = money(allocatedTax);
    summaryNodes.tableGrandTotal.textContent = money(grandTotal);

    summaryNodes.checkCard.classList.toggle("warning", hasMismatch);
    summaryNodes.allocationCheck.textContent = hasMismatch ? "Needs Review" : "Balanced";
    summaryNodes.allocationNote.textContent = hasMismatch
      ? `Allocated tax differs from entered tax by ${money(difference)}.`
      : "Allocated tax matches the entered sales tax.";
  }

  async function copyResults() {
    const totalTax = sanitizeCurrencyInput(totalTaxInput.value) ?? 0;
    const rows = getRows().map((row) => ({ row, ...rowData(row) }));
    const activeRows = rows.filter(({ hasPrice }) => hasPrice);
    const { subtotal, allocations } = calculateAllocations(totalTax, activeRows);

    if (!activeRows.length) {
      showStatus("Add at least one priced item before copying results.", "error");
      return;
    }

    const header = ["Item #", "Item Description", "Item Price", "Tax Allocation", "Item Total"];
    const lines = [header.join("\t")];

    activeRows.forEach((item, index) => {
      const allocation = allocations[index];
      lines.push([
        String(index + 1),
        item.description,
        formatMoneyForField(item.price),
        formatMoneyForField(allocation),
        formatMoneyForField(roundToCents(item.price + allocation))
      ].join("\t"));
    });

    lines.push(["", "Totals", formatMoneyForField(subtotal), formatMoneyForField(roundToCents(allocations.reduce((sum, value) => sum + value, 0))), formatMoneyForField(roundToCents(subtotal + allocations.reduce((sum, value) => sum + value, 0)))].join("\t"));

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      showStatus("Results copied to your clipboard as tab-separated rows.", "success");
    } catch (error) {
      showStatus("Clipboard copy was blocked by the browser. You can still select the table manually.", "error");
    }
  }

  function loadExample() {
    totalTaxInput.value = EXAMPLE_TAX;
    const rows = getRows();
    while (rows.length > DEFAULT_ROWS) {
      rows.pop().remove();
    }
    getRows().forEach((row, index) => {
      const descriptionInput = row.querySelector(".description-input");
      const priceInput = row.querySelector(".price-cell");
      const example = EXAMPLE_ITEMS[index];
      descriptionInput.value = example ? example.description : "";
      priceInput.value = example ? example.price : "";
    });
    updateWorksheet();
    showStatus("Example order loaded.", "success");
  }

  function resetWorksheet() {
    itemsBody.innerHTML = "";
    totalTaxInput.value = "";
    for (let index = 0; index < DEFAULT_ROWS; index += 1) {
      createRow();
    }
    showStatus();
    updateWorksheet();
  }

  totalTaxInput.addEventListener("input", updateWorksheet);
  totalTaxInput.addEventListener("blur", () => {
    const parsed = sanitizeCurrencyInput(totalTaxInput.value);
    totalTaxInput.value = parsed === null ? totalTaxInput.value.trim() : formatMoneyForField(parsed);
    updateWorksheet();
  });

  addRowButton.addEventListener("click", () => {
    createRow();
    updateWorksheet();
  });
  loadExampleButton.addEventListener("click", loadExample);
  copyButton.addEventListener("click", copyResults);
  resetButton.addEventListener("click", resetWorksheet);

  resetWorksheet();
})();
