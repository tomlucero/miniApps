(() => {
  const form = document.getElementById("tagForm");
  const orderNumber = document.getElementById("orderNumber");
  const customerLastName = document.getElementById("customerLastName");
  const itemDescription = document.getElementById("itemDescription");
  const itemLocation = document.getElementById("itemLocation");
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

  function buildSheet() {
    const order = displayValue(orderNumber.value);
    const customer = displayValue(customerLastName.value);
    const item = displayValue(itemDescription.value);
    const location = displayValue(itemLocation.value);
    const notes = optionalNotes.value.trim();

    const sheet = document.createElement("article");
    sheet.className = "tag-sheet";
    sheet.setAttribute("aria-label", "Oversized item reminder and tag sheet");

    const reminder = document.createElement("section");
    reminder.className = "tag-section pick-reminder";
    reminder.innerHTML = `
      <p class="section-instruction">Staple this section to pick list.</p>
      <h2 class="tag-title">ORDER HAS OVERSIZED ITEM</h2>
      <p class="tag-copy">Please retrieve the following item from the oversized item rack/location:</p>
      <div class="tag-details"></div>
    `;
    const reminderDetails = reminder.querySelector(".tag-details");
    reminderDetails.append(
      fieldMarkup("Item", item, "", true),
      fieldMarkup("Location", location, "", true),
      fieldMarkup("Order", `#${order}`, "order-number"),
      fieldMarkup("Customer Last Name", customer)
    );
    if (notes) reminderDetails.append(fieldMarkup("Optional Notes", notes, "", true));

    const itemTag = document.createElement("section");
    itemTag.className = "tag-section item-tag";
    itemTag.innerHTML = `
      <span class="cut-label">Cut along dashed line</span>
      <p class="section-instruction">Attach this section to oversized item.</p>
      <h2 class="tag-title">OVERSIZED ITEM</h2>
      <div class="tag-details"></div>
    `;
    itemTag.querySelector(".tag-details").append(
      fieldMarkup("Order", `#${order}`, "order-number"),
      fieldMarkup("Customer Last Name", customer),
      fieldMarkup("Item", item, "", true),
      fieldMarkup("Location", location, "", true)
    );

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
    const requiredFields = [orderNumber, customerLastName, itemDescription, itemLocation];
    const firstEmpty = requiredFields.find((field) => !field.value.trim());
    if (!firstEmpty) return true;
    formStatus.textContent = "Complete the order number, customer last name, item description, and location before printing.";
    formStatus.className = "form-status mt-4 error";
    firstEmpty.focus();
    return false;
  }

  function resetApp() {
    form.reset();
    renderPreview();
    orderNumber.focus();
  }

  form.addEventListener("input", renderPreview);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    renderPreview();
    if (!validate()) return;
    formStatus.textContent = "Your oversized item tag sheet is ready to print.";
    formStatus.className = "form-status mt-4 success";
    window.print();
  });
  document.getElementById("resetButton").addEventListener("click", resetApp);
  document.getElementById("clearButton").addEventListener("click", resetApp);

  renderPreview();
})();
