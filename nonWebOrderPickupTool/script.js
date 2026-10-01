(() => {
  const form = document.getElementById("pickupForm");
  const screenPreview = document.getElementById("screenPreview");
  const printArea = document.getElementById("printArea");
  const formStatus = document.getElementById("formStatus");
  const paymentError = document.getElementById("paymentError");

  const fieldIds = ["customerName", "department", "items", "pickupDate", "contact", "notes"];

  function value(id) {
    return document.getElementById(id).value.trim();
  }

  function paymentStatus() {
    return form.elements.paymentStatus.value;
  }

  function formatDate(dateValue) {
    if (!dateValue) return "";
    const [year, month, day] = dateValue.split("-").map(Number);
    return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" })
      .format(new Date(year, month - 1, day));
  }

  function appendField(grid, label, text, className = "") {
    const field = document.createElement("div");
    field.className = `document-field ${className}`.trim();
    const fieldLabel = document.createElement("span");
    fieldLabel.className = "document-label";
    fieldLabel.textContent = label;
    const fieldValue = document.createElement("span");
    fieldValue.className = `document-value${text ? "" : " placeholder"}`;
    fieldValue.textContent = text || "Not yet entered";
    field.append(fieldLabel, fieldValue);
    grid.appendChild(field);
  }

  function buildDocument() {
    const sheet = document.createElement("article");
    sheet.className = "pickup-sheet";

    const header = document.createElement("header");
    header.className = "document-head";
    const heading = document.createElement("div");
    const title = document.createElement("h2");
    title.textContent = "SPECIAL ORDER PICKUP";
    const subtitle = document.createElement("p");
    subtitle.textContent = "CSU Bookstore Pickup Counter";
    heading.append(title, subtitle);
    const logo = document.createElement("img");
    logo.className = "document-logo";
    logo.src = "../Bookstore-VPSA-CSU-HBlk.png";
    logo.alt = "CSU Bookstore";
    header.append(heading, logo);

    const grid = document.createElement("section");
    grid.className = "document-grid";
    appendField(grid, "Customer Name", value("customerName"));
    appendField(grid, "CSU Department", value("department"));
    appendField(grid, "Item(s)", value("items"), "full items-field");
    appendField(grid, "Expected Pickup Date", formatDate(value("pickupDate")));
    appendField(grid, "Recipient Phone or Email", value("contact"));
    if (value("notes")) appendField(grid, "Notes", value("notes"), "full notes-field");

    const payment = document.createElement("section");
    payment.className = "payment-banner";
    const paymentText = document.createElement("strong");
    const paymentHint = document.createElement("span");
    if (paymentStatus() === "paid") {
      paymentText.textContent = "PAID";
      paymentHint.textContent = "No payment due at pickup";
    } else if (paymentStatus() === "collect") {
      paymentText.textContent = "PAYMENT REQUIRED BEFORE RELEASE";
      paymentHint.textContent = "Collect payment before giving the item(s) to the customer";
    } else {
      paymentText.textContent = "PAYMENT STATUS NOT SELECTED";
      paymentHint.textContent = "Select Paid or Collect Payment";
    }
    payment.append(paymentText, paymentHint);

    const confirmation = document.createElement("section");
    confirmation.className = "confirmation";
    confirmation.innerHTML = `
      <h3>PICKUP CONFIRMATION</h3>
      <p>I acknowledge that I received the item(s) listed above.</p>
      <div class="signature-grid">
        <div><div class="signature-line"></div><span class="signature-label">Customer Signature</span></div>
        <div><div class="signature-line"></div><span class="signature-label">Date</span></div>
      </div>
      <div class="staff-line"><div class="signature-line"></div><span class="signature-label">Staff Initials</span></div>
      <p class="retention-note">The signed form will be retained by the CSU Bookstore for one year and then discarded.</p>
    `;

    sheet.append(header, grid, payment, confirmation);
    return sheet;
  }

  function render() {
    screenPreview.replaceChildren(buildDocument());
  }

  function showError(message = "") {
    formStatus.textContent = message;
    formStatus.className = `form-status mt-4${message ? " error" : ""}`;
  }

  function validate() {
    form.classList.add("was-validated");
    const hasPayment = Boolean(paymentStatus());
    paymentError.hidden = hasPayment;
    if (form.checkValidity() && hasPayment) {
      showError();
      return true;
    }
    showError("Complete the highlighted required fields before printing.");
    const firstInvalid = form.querySelector(":invalid");
    (firstInvalid || document.querySelector("input[name='paymentStatus']"))?.focus();
    return false;
  }

  function hasMeaningfulData() {
    return fieldIds.some((id) => value(id)) || Boolean(paymentStatus());
  }

  function clearForm() {
    if (hasMeaningfulData() && !window.confirm("Clear all pickup information and start a new form?")) return;
    form.reset();
    form.classList.remove("was-validated");
    paymentError.hidden = true;
    showError();
    render();
    document.getElementById("customerName").focus();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validate()) return;
    printArea.replaceChildren(buildDocument());
    window.print();
  });

  form.addEventListener("input", () => {
    if (paymentStatus()) paymentError.hidden = true;
    showError();
    render();
  });
  form.addEventListener("change", render);
  document.getElementById("clearButton").addEventListener("click", clearForm);
  document.getElementById("newFormButton").addEventListener("click", clearForm);

  render();
})();
