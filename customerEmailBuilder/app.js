(() => {
  'use strict';

  const config = window.CUSTOMER_EMAIL_BUILDER_CONFIG;
  if (!config) throw new Error('Customer Email Builder template configuration is missing.');

  const $ = id => document.getElementById(id);
  const form = $('builderForm');
  const templateSelect = $('templateType');

  // Build the selector from templates.js so labels and ordering stay editable there.
  Object.entries(config.templates).forEach(([value, template]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = template.label;
    templateSelect.appendChild(option);
  });

  Object.entries(config.signatures).forEach(([value, signature]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = signature.label;
    $('signatureOption').appendChild(option);
  });

  // Build three substitution rows. Product names are always entered manually.
  for (let i = 1; i <= 3; i++) {
    $('substitutionRows').insertAdjacentHTML('beforeend', `
      <div class="border rounded-3 p-3 bg-white">
        <div class="fw-semibold small mb-2">Substitution ${i}</div>
        <div class="row g-2">
          <div class="col-12"><label class="visually-hidden" for="subName${i}">Substitution ${i} name</label><input class="form-control" id="subName${i}" type="text" placeholder="Product name"></div>
          <div class="col-sm-5"><label class="visually-hidden" for="subPrice${i}">Substitution ${i} price</label><input class="form-control" id="subPrice${i}" type="number" inputmode="decimal" min="0" step="0.01" placeholder="0.00"></div>
          <div class="col-sm-7"><label class="visually-hidden" for="subUrl${i}">Substitution ${i} URL</label><input class="form-control" id="subUrl${i}" type="url" placeholder="https://..." aria-describedby="subUrlWarning${i}"></div>
          <div class="col-12"><div class="alert alert-warning border-warning fw-semibold py-2 mb-0 d-none" id="subUrlWarning${i}" role="alert">${config.productUrlValidation.warning}</div></div>
        </div>
      </div>`);
  }

  const copyTemplate = template => ({
    subject: template.subject,
    body: template.body,
    note: template.note
  });
  const defaultTemplates = Object.fromEntries(
    Object.entries(config.templates).map(([key, template]) => [key, copyTemplate(template)])
  );
  const templates = Object.fromEntries(
    Object.entries(defaultTemplates).map(([key, template]) => [key, copyTemplate(template)])
  );

  let savedTemplates = {};
  try {
    savedTemplates = JSON.parse(localStorage.getItem(config.storageKey) || '{}');
    Object.entries(savedTemplates).forEach(([key, value]) => {
      const valid = templates[key] && ['subject', 'body', 'note'].every(field => typeof value[field] === 'string');
      if (valid) templates[key] = copyTemplate(value);
    });
  } catch {
    savedTemplates = {};
  }

  function clean(value, fallback) {
    return value.trim() || fallback;
  }

  function formatCurrency(value, fallback = '') {
    const raw = String(value).trim();
    if (!raw) return fallback;
    const amount = Number(raw);
    return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : fallback;
  }

  function formatDate(value) {
    if (!value) return '[date]';
    const [year, month, day] = value.split('-');
    return `${month}/${day}/${year}`;
  }

  function today() {
    const date = new Date();
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
  }

  function formatTime(value) {
    if (!value) return '[time]';
    let [hour, minute] = value.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${String(minute).padStart(2, '0')} ${period}`;
  }

  function replaceTokens(text, values) {
    return Object.entries(values).reduce(
      (result, [key, value]) => result.replaceAll(`{${key}}`, value),
      text
    );
  }

  function renderTemplate(text, values, note = false) {
    const item = values.item ? (note ? ` (${values.item})` : `, ${values.item},`) : '';
    return replaceTokens(text, { ...values, item });
  }

  function getDeadlineText() {
    const deadlineDate = formatDate($('deadlineDate').value);
    const deadlineTime = formatTime($('deadlineTime').value);
    const action = config.deadlineText.actions[$('noResponseAction').value];
    return {
      email: `${replaceTokens(config.deadlineText.requestEmail, { deadlineDate, deadlineTime })} ${action.email}`,
      note: `${replaceTokens(config.deadlineText.requestNote, { deadlineDate, deadlineTime })} ${action.note}`
    };
  }

  function getSubstitutionList() {
    const choices = [];
    for (let i = 1; i <= 3; i++) {
      const name = $(`subName${i}`).value.trim();
      const price = formatCurrency($(`subPrice${i}`).value);
      const url = $(`subUrl${i}`).value.trim();
      if (name || price || url) {
        choices.push(`• ${name || config.sharedText.missingProductName}${price ? ` — ${price}` : ''}${url ? `\n  ${url}` : ''}`);
      }
    }
    return choices.length ? choices.join('\n\n') : config.emptySubstitutions.join('\n\n');
  }

  function isInternalCatalogUrl(url) {
    return /merchdetail\?|merchid=|categoryname=|catid=|type=/i.test(url);
  }

  function validateProductUrls(enabled) {
    let valid = true;
    for (let i = 1; i <= 3; i++) {
      const input = $(`subUrl${i}`);
      const invalid = enabled && isInternalCatalogUrl(input.value.trim());
      input.classList.toggle('is-invalid', invalid);
      $(`subUrlWarning${i}`).classList.toggle('d-none', !invalid);
      if (invalid) valid = false;
    }
    return valid;
  }

  function selectedFields() {
    return config.templates[templateSelect.value].fields || {};
  }

  function updateVisibility() {
    const fields = selectedFields();
    $('itemFields').classList.toggle('d-none', !fields.item);
    $('originalPriceField').classList.toggle('d-none', !fields.substitutions);
    $('restockOptionFields').classList.toggle('d-none', !fields.restockExpected);
    $('restockDetails').classList.toggle('d-none', !fields.restockExpected || !$('moreInventoryExpected').checked);
    $('stockOrderContentsFields').classList.toggle('d-none', !fields.stockOrderContents);
    $('substitutionFields').classList.toggle('d-none', !fields.substitutions);
    $('pickupFields').classList.toggle('d-none', !fields.pickup);
    $('firstReminderField').classList.toggle('d-none', !fields.finalPickup);
    $('dayOneFields').classList.toggle('d-none', !fields.dayOne);
    $('deadlineFields').classList.toggle('d-none', !$('addDeadline').checked);
  }

  function loadTemplateEditor() {
    const template = templates[templateSelect.value];
    $('editorSubject').value = template.subject;
    $('editorBody').value = template.body;
    $('editorNote').value = template.note;
    $('templateSaveStatus').textContent = savedTemplates[templateSelect.value] ? 'Using saved edits.' : '';
  }

  function saveTemplateEdit() {
    const type = templateSelect.value;
    templates[type] = {
      subject: $('editorSubject').value,
      body: $('editorBody').value,
      note: $('editorNote').value
    };
    savedTemplates[type] = copyTemplate(templates[type]);
    try {
      localStorage.setItem(config.storageKey, JSON.stringify(savedTemplates));
    } catch {
      // Live preview still works when browser storage is unavailable.
    }
    $('templateSaveStatus').textContent = 'Saved.';
  }

  function generate() {
    updateVisibility();

    const type = templateSelect.value;
    const fields = selectedFields();
    const template = templates[type];
    const employee = clean($('employeeName').value, '[student employee name]');
    const customer = clean($('customerName').value, '[customer full name]');
    const order = clean($('orderNumber').value, '[order number]');
    const validOrder = /^\d{6}$/.test($('orderNumber').value.trim());
    const originalPrice = formatCurrency($('originalPrice').value, '[original item price]');
    const custom = $('customNote').value.trim();
    const hasDeadline = $('addDeadline').checked;
    const deadline = getDeadlineText();
    const signature = config.signatures[$('signatureOption').value];
    const signatureName = signature.name || employee;
    const values = {
      employee,
      signatureName,
      customer,
      orderNumber: order,
      item: $('originalItem').value.trim(),
      originalPrice,
      packedDate: formatDate($('datePacked').value),
      firstReminderDate: formatDate($('firstReminderDate').value),
      restockDate: formatDate($('restockDate').value),
      expectedRestockDate: formatDate($('expectedRestockDate').value),
      restockResponseDeadline: formatDate($('restockResponseDeadline').value),
      dayOneTitle: clean($('dayOneTitle').value, '[Day One Access title]'),
      courseName: clean($('courseName').value, '[class/course]')
    };

    const validProductUrls = validateProductUrls(fields.substitutions);
    if (!validProductUrls) {
      $('subjectOutput').textContent = config.productUrlValidation.blockedOutput;
      $('emailOutput').textContent = config.productUrlValidation.blockedOutput;
      $('insiteOutput').textContent = config.productUrlValidation.blockedOutput;
      document.querySelectorAll('[data-copy]').forEach(button => button.disabled = true);
      $('orderNumber').classList.toggle('is-invalid', $('orderNumber').value.length > 0 && !validOrder);
      $('orderRequirement').classList.toggle('text-danger', !validOrder);
      return;
    }

    const renderedBody = renderTemplate(template.body, values);
    let body = `${replaceTokens(config.sharedText.greeting, values)}\n\n${renderedBody}`;

    if (fields.substitutions) {
      body += `\n\n${getSubstitutionList()}`;
      if ($('honorOriginalPrice').checked) {
        body += `\n\n${replaceTokens(config.sharedText.honorOriginalPrice, values)}`;
      }
      body += `\n\n${config.sharedText.substitutionPrompt}`;
    }

    if (fields.restockExpected && $('moreInventoryExpected').checked) {
      body += `\n\n${replaceTokens(config.sharedText.restockExpectedEmail, values)}`;
      body += `\n\n${config.sharedText.restockQuestions}`;
      body += `\n\n${replaceTokens(config.sharedText.restockDeadlineEmail, values)}`;
    }

    if (fields.stockOrderContents && !(fields.restockExpected && $('moreInventoryExpected').checked)) {
      body += `\n\n${$('onlyStockItem').checked ? config.sharedText.stockOnlyEmail : config.sharedText.stockMoreEmail}`;
    }

    if (fields.dayOne) {
      const includesRequiredDetails = [values.dayOneTitle, values.courseName, values.orderNumber]
        .every(value => renderedBody.includes(value));
      if (!includesRequiredDetails) {
        body += `\n\n${replaceTokens(config.sharedText.dayOneDetailsFallback, values)}`;
      }
      body += `\n\n${$('onlyTitle').checked ? config.sharedText.dayOneOnlyEmail : config.sharedText.dayOneMoreEmail}`;
    }

    if (custom) body += `\n\n${custom}`;
    if (hasDeadline) body += `\n\n${deadline.email}`;
    body += `\n\n${config.sharedText.replyHelp}`;
    body += `\n\n${replaceTokens(signature.email, values)}`;
    body += `\n\n${config.sharedText.footer}`;

    let action = renderTemplate(template.note, values, true).replace(/\.*$/, '');
    if (fields.dayOne) {
      const includesRequiredDetails = [values.dayOneTitle, values.courseName].every(value => action.includes(value));
      if (!includesRequiredDetails) action = replaceTokens(config.sharedText.dayOneNoteLead, values);
      action += `. ${$('onlyTitle').checked ? config.sharedText.dayOneOnlyNote : config.sharedText.dayOneMoreNote}`;
    }
    if (fields.restockExpected && $('moreInventoryExpected').checked) {
      action += `. ${replaceTokens(config.sharedText.restockNote, values)}`;
    }
    if (fields.stockOrderContents && !(fields.restockExpected && $('moreInventoryExpected').checked)) {
      action += `. ${$('onlyStockItem').checked ? config.sharedText.stockOnlyNote : config.sharedText.stockMoreNote}`;
    }
    if (hasDeadline) {
      const noteDeadline = fields.substitutions
        ? deadline.note
        : `${deadline.note.charAt(0).toUpperCase()}${deadline.note.slice(1)}`;
      action += `${fields.substitutions ? ' and ' : '. '}${noteDeadline}`;
    }
    if (!/[.!?]$/.test(action)) action += '.';
    if (custom) action += ` ${replaceTokens(config.sharedText.additionalNote, { customNote: custom })}`;

    const subject = template.subject.includes('{orderNumber}')
      ? replaceTokens(template.subject, values)
      : `${template.subject} #${order}`;
    $('subjectOutput').textContent = subject;
    $('emailOutput').textContent = body;
    $('insiteOutput').textContent = `${today()} - ${action} - ${employee}`;

    document.querySelectorAll('[data-copy]').forEach(button => button.disabled = !validOrder);
    $('orderNumber').classList.toggle('is-invalid', $('orderNumber').value.length > 0 && !validOrder);
    $('orderRequirement').classList.toggle('text-danger', !validOrder);
  }

  ['editorSubject', 'editorBody', 'editorNote'].forEach(id => $(id).addEventListener('input', saveTemplateEdit));
  templateSelect.addEventListener('change', loadTemplateEditor);

  $('resetTemplate').addEventListener('click', () => {
    const type = templateSelect.value;
    templates[type] = copyTemplate(defaultTemplates[type]);
    delete savedTemplates[type];
    try { localStorage.setItem(config.storageKey, JSON.stringify(savedTemplates)); } catch {}
    loadTemplateEditor();
    $('templateSaveStatus').textContent = 'Selected template reset.';
    generate();
  });

  $('clearTemplateEdits').addEventListener('click', () => {
    savedTemplates = {};
    Object.keys(defaultTemplates).forEach(key => templates[key] = copyTemplate(defaultTemplates[key]));
    try { localStorage.removeItem(config.storageKey); } catch {}
    loadTemplateEditor();
    $('templateSaveStatus').textContent = 'All saved template edits cleared.';
    generate();
  });

  $('resetFields').addEventListener('click', () => {
    form.reset();
    loadTemplateEditor();
    $('templateSaveStatus').textContent = savedTemplates[templateSelect.value] ? 'Using saved edits.' : '';
    generate();
  });

  form.addEventListener('input', generate);
  form.addEventListener('change', generate);

  document.querySelectorAll('[data-copy]').forEach(button => {
    button.addEventListener('click', async () => {
      if (!/^\d{6}$/.test($('orderNumber').value.trim()) || !validateProductUrls(selectedFields().substitutions)) return;
      const text = $(button.dataset.copy).textContent;
      try {
        await navigator.clipboard.writeText(text);
        const original = button.textContent;
        button.textContent = 'Copied!';
        $('copyStatus').textContent = `${button.closest('section').querySelector('h3').textContent} copied.`;
        setTimeout(() => button.textContent = original, 1400);
      } catch {
        const range = document.createRange();
        range.selectNodeContents($(button.dataset.copy));
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        $('copyStatus').textContent = 'Text selected. Press Control or Command+C to copy.';
      }
    });
  });

  loadTemplateEditor();
  generate();
})();
