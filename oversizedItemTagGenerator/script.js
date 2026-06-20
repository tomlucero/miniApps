(() => {
  const form = document.getElementById("tagForm");
  const itemType = document.getElementById("itemType");
  const orderNumber = document.getElementById("orderNumber");
  const customerLastName = document.getElementById("customerLastName");
  const itemDescription = document.getElementById("itemDescription");
  const locationPreset = document.getElementById("locationPreset");
  const customLocationField = document.getElementById("customLocationField");
  const customLocation = document.getElementById("customLocation");
  const skuUpc = document.getElementById("skuUpc");
  const optionalNotes = document.getElementById("optionalNotes");
  const screenPreview = document.getElementById("screenPreview");
  const printArea = document.getElementById("printArea");
  const formStatus = document.getElementById("formStatus");

  function displayValue(value, fallback = "—") {
    return value.trim() || fallback;
  }

  function fieldMarkup(label, value, className = "", full = false) {
    const field = document.createElement("div");
    field.className = `tag-field${full ? " full" : ""}`;
    const fieldLabel = document.createElement("span");
    fieldLabel.className = "tag-label";
    fieldLabel.textContent = label;
    const fieldValue = document.createElement("span");
    fieldValue.className = `tag-value${className ? ` ${className}` : ""}`;
    fieldValue.textContent = value;
    field.append(fieldLabel, fieldValue);
    return field;
  }

  function logoMarkup() {
    const logo = document.createElement("img");
    logo.className = "tag-logo";
    logo.src = "../Bookstore-VPSA-CSU-HBlk.png";
    logo.alt = "CSU Bookstore";
    return logo;
  }

  function selectedLocation() {
    return locationPreset.value === "other" ? customLocation.value.trim() : locationPreset.value;
  }

  function updateLocationField() {
    const isCustom = locationPreset.value === "other";
    customLocationField.classList.toggle("d-none", !isCustom);
    customLocation.required = isCustom;
  }

  function buildSheet() {
    const type = itemType.value;
    const typeLower = type.toLowerCase();
    const order = displayValue(orderNumber.value);
    const customer = displayValue(customerLastName.value);
    const item = displayValue(itemDescription.value);
    const location = displayValue(selectedLocation());
    const sku = skuUpc.value.trim();
    const notes = optionalNotes.value.trim();

    const sheet = document.createElement("article");
    sheet.className = "tag-sheet";
    sheet.setAttribute("aria-label", `${type} reminder and tag sheet`);

    const reminder = document.createElement("section");
    reminder.className = "tag-section pick-reminder";
    reminder.innerHTML = `
      <p class="section-instruction">Staple this section to pick list.</p>
      <h2 class="tag-title">ORDER HAS ${type.toUpperCase()}</h2>
      <div class="tag-details"></div>
      <div class="section-footer">
        <div class="acknowledgment">
          <p>I received the ${typeLower}s in my order.</p>
          <div class="signature-lines">
            <span>Customer Signature</span>
            <span>Date</span>
          </div>
        </div>
      </div>
    `;
    const reminderDetails = reminder.querySelector(".tag-details");
    reminderDetails.append(
      fieldMarkup("Item Type", type),
      fieldMarkup("Location", location),
      fieldMarkup("Item", item, "", true),
      fieldMarkup("Order", `#${order}`, "order-number"),
      fieldMarkup("Customer Last Name", customer)
    );
    if (sku) reminderDetails.append(fieldMarkup("SKU / UPC", sku));
    if (notes) reminderDetails.append(fieldMarkup("Optional Notes", notes, "", !sku));
    reminder.querySelector(".section-footer").append(logoMarkup());

    const itemTag = document.createElement("section");
    itemTag.className = "tag-section item-tag";
    itemTag.innerHTML = `
      <span class="cut-label">Cut along dashed line</span>
      <p class="section-instruction">Attach this section to ${typeLower}.</p>
      <h2 class="tag-title">${type.toUpperCase()}</h2>
      <div class="tag-details"></div>
    `;
    const itemTagDetails = itemTag.querySelector(".tag-details");
    itemTagDetails.append(
      fieldMarkup("Order", `#${order}`, "order-number"),
      fieldMarkup("Customer Last Name", customer, "customer-name"),
      fieldMarkup("Item Type", type),
      fieldMarkup("Location", location),
      fieldMarkup("Item", item, "item-emphasis", true)
    );
    if (sku) itemTagDetails.append(fieldMarkup("SKU / UPC", sku, "sku-emphasis"));
    if (notes) itemTagDetails.append(fieldMarkup("Optional Notes", notes, "notes-emphasis", !sku));
    const itemTagFooter = document.createElement("div");
    itemTagFooter.className = "section-footer item-tag-footer";
    itemTagFooter.append(logoMarkup());
    itemTag.append(itemTagFooter);

    sheet.append(reminder, itemTag);
    return sheet;
  }

  function renderPreview() {
    screenPreview.replaceChildren(buildSheet());
    printArea.replaceChildren(buildSheet());
    formStatus.textContent = "";
    formStatus.className = "form-status mt-4";
  }

  function validate() {
    const requiredFields = [itemType, orderNumber, customerLastName, itemDescription, locationPreset];
    if (locationPreset.value === "other") requiredFields.push(customLocation);
    const firstEmpty = requiredFields.find((field) => !field.value.trim());
    if (!firstEmpty) return true;
    formStatus.textContent = "Complete the item type, order number, customer last name, item description, and location before printing.";
    formStatus.className = "form-status mt-4 error";
    firstEmpty.focus();
    return false;
  }

  function resetApp() {
    form.reset();
    updateLocationField();
    renderPreview();
    orderNumber.focus();
  }

  form.addEventListener("input", renderPreview);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    renderPreview();
    if (!validate()) return;
    formStatus.textContent = `Your ${itemType.value.toLowerCase()} tag sheet is ready to print.`;
    formStatus.className = "form-status mt-4 success";
    window.print();
  });
  document.getElementById("resetButton").addEventListener("click", resetApp);
  document.getElementById("clearButton").addEventListener("click", resetApp);
  locationPreset.addEventListener("change", () => {
    updateLocationField();
    renderPreview();
  });

  updateLocationField();
  renderPreview();
})();
