(() => {
  const ALERT_TYPES = {
    info: {
      label: "Information",
      className: "bk-alert-info",
      defaultIcon: "fa-solid fa-circle-info"
    },
    note: {
      label: "FYI / Note",
      className: "bk-alert-note",
      defaultIcon: "fa-solid fa-note-sticky"
    },
    attention: {
      label: "Attention",
      className: "bk-alert-attention",
      defaultIcon: "fa-solid fa-triangle-exclamation"
    },
    important: {
      label: "Important / Deadline",
      className: "bk-alert-important",
      defaultIcon: "fa-solid fa-circle-exclamation"
    },
    success: {
      label: "Success / Available",
      className: "bk-alert-success",
      defaultIcon: "fa-solid fa-circle-check"
    }
  };

  const ICON_OPTIONS = {
    auto: { label: "Automatic icon based on alert type", className: "" },
    none: { label: "No icon", className: "" },
    information: { label: "Information", className: "fa-solid fa-circle-info" },
    note: { label: "Note", className: "fa-solid fa-note-sticky" },
    warning: { label: "Warning", className: "fa-solid fa-triangle-exclamation" },
    important: { label: "Important", className: "fa-solid fa-circle-exclamation" },
    success: { label: "Success", className: "fa-solid fa-circle-check" },
    calendar: { label: "Calendar", className: "fa-solid fa-calendar-days" },
    clock: { label: "Clock", className: "fa-solid fa-clock" },
    book: { label: "Book", className: "fa-solid fa-book" },
    shoppingBag: { label: "Shopping Bag", className: "fa-solid fa-bag-shopping" },
    pickup: { label: "Box / Pickup", className: "fa-solid fa-box-open" },
    graduation: { label: "Graduation", className: "fa-solid fa-graduation-cap" },
    laptop: { label: "Laptop", className: "fa-solid fa-laptop" },
    ramHead: { label: "CSU Ram Head", className: "fa-kit fa-csuramhead" },
    aggieA: { label: "Aggie A", className: "fa-kit fa-csu-aggie-a" },
    semesterAtSea: { label: "Semester at Sea", className: "fa-solid fa-ship" }
  };

  const DEFAULTS = {
    type: "info",
    label: "Information",
    title: "Course Materials Availability",
    message: "<p>Course materials for the fall semester go on sale August 1.</p>",
    icon: "auto",
    buttonText: "",
    buttonUrl: "",
    note: "",
    tint: false,
    compact: false,
    lightButton: false,
    schedule: false,
    startDate: "",
    endDate: ""
  };

  const ALLOWED_TAGS = new Set(["P", "STRONG", "EM", "UL", "OL", "LI", "A", "BR"]);
  const formStatus = document.getElementById("formStatus");
  const alertType = document.getElementById("alertType");
  const iconChoice = document.getElementById("iconChoice");
  const labelInput = document.getElementById("labelInput");
  const titleInput = document.getElementById("titleInput");
  const messageEditor = document.getElementById("messageEditor");
  const buttonTextInput = document.getElementById("buttonTextInput");
  const buttonUrlInput = document.getElementById("buttonUrlInput");
  const secondaryNoteInput = document.getElementById("secondaryNoteInput");
  const tintToggle = document.getElementById("tintToggle");
  const compactToggle = document.getElementById("compactToggle");
  const lightButtonToggle = document.getElementById("lightButtonToggle");
  const scheduleToggle = document.getElementById("scheduleToggle");
  const scheduleFields = document.getElementById("scheduleFields");
  const startDateInput = document.getElementById("startDateInput");
  const endDateInput = document.getElementById("endDateInput");
  const alertPreview = document.getElementById("alertPreview");
  const htmlOutput = document.getElementById("htmlOutput");
  const scheduleSummary = document.getElementById("scheduleSummary");
  const copyHtmlButton = document.getElementById("copyHtmlButton");
  const resetButton = document.getElementById("resetButton");
  const linkButton = document.getElementById("linkButton");
  let savedSelection = null;

  function populateSelect(select, options) {
    Object.entries(options).forEach(([value, option]) => {
      const element = document.createElement("option");
      element.value = value;
      element.textContent = option.label;
      select.appendChild(element);
    });
  }

  function escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function showStatus(message = "", type = "") {
    formStatus.textContent = message;
    formStatus.className = `form-status${type ? ` ${type}` : ""}`;
  }

  function normalizeUrl(url) {
    const trimmed = url.trim();
    if (!trimmed) return "";
    if (/^(https?:\/\/|\/|#|mailto:)/i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }

  function sanitizeLinkHref(url) {
    const normalized = normalizeUrl(url);
    if (!normalized) return "";
    if (/^(javascript|data):/i.test(normalized)) return "";
    return normalized;
  }

  function sanitizeMessageHtml(inputHtml) {
    const template = document.createElement("template");
    template.innerHTML = inputHtml;

    function sanitizeNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return document.createTextNode(node.textContent || "");
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return document.createTextNode("");
      }

      const tagName = node.tagName.toUpperCase();
      if (!ALLOWED_TAGS.has(tagName)) {
        const fragment = document.createDocumentFragment();
        Array.from(node.childNodes).forEach((child) => fragment.appendChild(sanitizeNode(child)));
        return fragment;
      }

      const cleanElement = document.createElement(tagName.toLowerCase());
      if (tagName === "A") {
        const href = sanitizeLinkHref(node.getAttribute("href") || "");
        if (href) {
          cleanElement.setAttribute("href", href);
        } else {
          const fragment = document.createDocumentFragment();
          Array.from(node.childNodes).forEach((child) => fragment.appendChild(sanitizeNode(child)));
          return fragment;
        }
      }

      Array.from(node.childNodes).forEach((child) => cleanElement.appendChild(sanitizeNode(child)));
      return cleanElement;
    }

    const wrapper = document.createElement("div");
    Array.from(template.content.childNodes).forEach((child) => wrapper.appendChild(sanitizeNode(child)));

    Array.from(wrapper.querySelectorAll("p, ul, ol")).forEach((element) => {
      if (!element.textContent.trim() && !element.querySelector("br")) {
        element.remove();
      }
    });

    const cleaned = wrapper.innerHTML.trim();
    return cleaned;
  }

  function selectedAlertType() {
    return ALERT_TYPES[alertType.value];
  }

  function selectedIconClass() {
    if (iconChoice.value === "auto") return selectedAlertType().defaultIcon;
    if (iconChoice.value === "none") return "";
    return ICON_OPTIONS[iconChoice.value].className;
  }

  function saveSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (messageEditor.contains(range.commonAncestorContainer)) {
      savedSelection = range.cloneRange();
    }
  }

  function restoreSelection() {
    if (!savedSelection) return false;
    const selection = window.getSelection();
    if (!selection) return false;
    selection.removeAllRanges();
    selection.addRange(savedSelection);
    return true;
  }

  function buildMarkup(state) {
    const type = ALERT_TYPES[state.type];
    const classes = ["bk-alert", type.className];
    if (state.tint) classes.push("bk-alert--tint");
    if (state.compact) classes.push("bk-alert--compact");
    if (state.schedule) classes.push("bk-alert-scheduled");

    const attrs = [`class="${classes.join(" ")}"`];
    if (state.schedule && state.startDate) attrs.push(`data-start="${state.startDate}"`);
    if (state.schedule && state.endDate) attrs.push(`data-end="${state.endDate}"`);

    const lines = [`<div ${attrs.join(" ")}>`];

    if (state.iconClass) {
      lines.push(`  <div class="bk-alert__icon">`);
      lines.push(`    <i class="${state.iconClass}" aria-hidden="true"></i>`);
      lines.push(`  </div>`);
    }

    lines.push(`  <div class="bk-alert__content">`);
    if (state.label) lines.push(`    <p class="bk-alert__label">${escapeHtml(state.label)}</p>`);
    if (state.title) lines.push(`    <h3 class="bk-alert__title">${escapeHtml(state.title)}</h3>`);

    if (state.messageHtml.trim()) {
      lines.push(`    <div class="bk-alert__message">`);
      state.messageHtml.split("\n").forEach((line) => lines.push(`      ${line}`));
      lines.push(`    </div>`);
    }

    if (state.buttonText && state.buttonUrl) {
      const buttonClasses = ["bk-alert__button"];
      if (state.lightButton) buttonClasses.push("bk-alert__button--light");
      lines.push(`    <div class="bk-alert__actions">`);
      lines.push(`      <a class="${buttonClasses.join(" ")}" href="${escapeHtml(state.buttonUrl)}">${escapeHtml(state.buttonText)}</a>`);
      lines.push(`    </div>`);
    }

    if (state.note) lines.push(`    <p class="bk-alert__note">${escapeHtml(state.note)}</p>`);
    lines.push(`  </div>`);
    lines.push(`</div>`);

    return lines.join("\n");
  }

  function collectState() {
    const sanitizedMessage = sanitizeMessageHtml(messageEditor.innerHTML);
    const temp = document.createElement("div");
    temp.innerHTML = sanitizedMessage;
    const messageHtml = temp.innerHTML.replace(/>\s+</g, ">\n<").trim();

    return {
      type: alertType.value,
      label: labelInput.value.trim(),
      title: titleInput.value.trim(),
      messageHtml,
      buttonText: buttonTextInput.value.trim(),
      buttonUrl: sanitizeLinkHref(buttonUrlInput.value),
      rawButtonUrl: buttonUrlInput.value.trim(),
      note: secondaryNoteInput.value.trim(),
      tint: tintToggle.checked,
      compact: compactToggle.checked,
      lightButton: lightButtonToggle.checked,
      schedule: scheduleToggle.checked,
      startDate: startDateInput.value,
      endDate: endDateInput.value,
      iconClass: selectedIconClass()
    };
  }

  function renderPreview(state, markup) {
    alertPreview.innerHTML = markup;
    if (!state.iconClass) {
      const previewAlert = alertPreview.querySelector(".bk-alert");
      if (previewAlert) previewAlert.style.gridTemplateColumns = "1fr";
    }
  }

  function updateScheduleSummary(state) {
    if (!state.schedule) {
      scheduleSummary.textContent = "Not scheduled";
      scheduleSummary.classList.remove("scheduled");
      return;
    }

    let text = "Scheduled";
    if (state.startDate && state.endDate) text = `${state.startDate} to ${state.endDate}`;
    else if (state.startDate) text = `Starts ${state.startDate}`;
    else if (state.endDate) text = `Ends ${state.endDate}`;

    scheduleSummary.textContent = text;
    scheduleSummary.classList.add("scheduled");
  }

  function validateState(state) {
    const hasButtonText = Boolean(state.buttonText);
    const hasButtonUrl = Boolean(state.rawButtonUrl);
    if (hasButtonText !== hasButtonUrl) {
      showStatus("To include a button, enter both button text and a button URL.", "error");
      return false;
    }
    if (state.rawButtonUrl && !state.buttonUrl) {
      showStatus("Button URL is not valid. Use https://, /path, #anchor, or mailto: links.", "error");
      return false;
    }
    if (state.endDate && state.startDate && state.endDate < state.startDate) {
      showStatus("End date must be the same as or after the start date.", "error");
      return false;
    }
    showStatus();
    return true;
  }

  function updateOutput() {
    scheduleFields.classList.toggle("d-none", !scheduleToggle.checked);
    const state = collectState();
    const isValid = validateState(state);
    const markup = buildMarkup(state);
    renderPreview(state, markup);
    htmlOutput.textContent = markup;
    updateScheduleSummary(state);
    copyHtmlButton.disabled = !isValid;
  }

  function resetBuilder() {
    alertType.value = DEFAULTS.type;
    iconChoice.value = DEFAULTS.icon;
    labelInput.value = DEFAULTS.label;
    titleInput.value = DEFAULTS.title;
    messageEditor.innerHTML = DEFAULTS.message;
    buttonTextInput.value = DEFAULTS.buttonText;
    buttonUrlInput.value = DEFAULTS.buttonUrl;
    secondaryNoteInput.value = DEFAULTS.note;
    tintToggle.checked = DEFAULTS.tint;
    compactToggle.checked = DEFAULTS.compact;
    lightButtonToggle.checked = DEFAULTS.lightButton;
    scheduleToggle.checked = DEFAULTS.schedule;
    startDateInput.value = DEFAULTS.startDate;
    endDateInput.value = DEFAULTS.endDate;
    showStatus();
    updateOutput();
  }

  async function copyHtml() {
    try {
      await navigator.clipboard.writeText(htmlOutput.textContent);
      showStatus("HTML copied to your clipboard.", "success");
    } catch {
      showStatus("Clipboard copy was blocked by the browser. You can still select and copy the HTML manually.", "error");
    }
  }

  function insertLink() {
    restoreSelection();
    const url = window.prompt("Enter the URL for this link:", "https://");
    if (!url) return;
    const safeHref = sanitizeLinkHref(url);
    if (!safeHref) {
      showStatus("That link could not be used. Try https://, /path, #anchor, or mailto: links.", "error");
      return;
    }
    messageEditor.focus();
    restoreSelection();
    document.execCommand("createLink", false, safeHref);
    saveSelection();
    updateOutput();
  }

  populateSelect(alertType, ALERT_TYPES);
  populateSelect(iconChoice, ICON_OPTIONS);

  alertType.addEventListener("change", () => {
    if (iconChoice.value === "auto" && !labelInput.value.trim()) {
      labelInput.value = ALERT_TYPES[alertType.value].label;
    }
    updateOutput();
  });

  [
    iconChoice,
    labelInput,
    titleInput,
    buttonTextInput,
    buttonUrlInput,
    secondaryNoteInput,
    tintToggle,
    compactToggle,
    lightButtonToggle,
    scheduleToggle,
    startDateInput,
    endDateInput
  ].forEach((element) => element.addEventListener("input", updateOutput));

  messageEditor.addEventListener("input", updateOutput);
  messageEditor.addEventListener("mouseup", saveSelection);
  messageEditor.addEventListener("keyup", saveSelection);
  messageEditor.addEventListener("focus", saveSelection);
  messageEditor.addEventListener("blur", () => {
    messageEditor.innerHTML = sanitizeMessageHtml(messageEditor.innerHTML);
    updateOutput();
  });

  document.querySelectorAll("[data-command]").forEach((button) => {
    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
      messageEditor.focus();
      restoreSelection();
    });
    button.addEventListener("click", () => {
      messageEditor.focus();
      restoreSelection();
      document.execCommand(button.dataset.command, false, null);
      saveSelection();
      messageEditor.focus();
      updateOutput();
    });
  });

  linkButton.addEventListener("click", insertLink);
  copyHtmlButton.addEventListener("click", copyHtml);
  resetButton.addEventListener("click", resetBuilder);

  resetBuilder();
})();
