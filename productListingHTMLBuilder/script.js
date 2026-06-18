const form = document.querySelector("#builderForm");
const preview = document.querySelector("#preview");
const htmlOutput = document.querySelector("#htmlOutput");
const copyButton = document.querySelector("#copyButton");
const resetButton = document.querySelector("#resetButton");
const copyStatus = document.querySelector("#copyStatus");
const productNameCounter = document.querySelector("#productNameCounter");
const productNameWarning = document.querySelector("#productNameWarning");
const categoryVariableSummary = document.querySelector("#categoryVariableSummary");
const categoryFields = document.querySelectorAll(".category-field");
const seoTitle = document.querySelector("#seoTitle");
const metaDescription = document.querySelector("#metaDescription");
const searchKeywords = document.querySelector("#searchKeywords");
const seoTitleCounter = document.querySelector("#seoTitleCounter");
const metaDescriptionCounter = document.querySelector("#metaDescriptionCounter");
const metadataCopyStatus = document.querySelector("#metadataCopyStatus");
const metadataCopyButtons = document.querySelectorAll(".metadata-copy");

const productNameLimit = 60;
const seoTitleLimit = 60;
const metaDescriptionLimit = 155;
const appVersion = "0.7";
const metadataDirty = {
  seoTitle: false,
  metaDescription: false,
  searchKeywords: false,
};

const fields = {
  employeeName: document.querySelector("#employeeName"),
  tone: document.querySelector("#tone"),
  category: document.querySelector("#category"),
  descriptionTemplate: document.querySelector("#descriptionTemplate"),
  snippet: document.querySelector("#snippet"),
  studentAccountEligible: document.querySelector("#studentAccountEligible"),
  productName: document.querySelector("#productName"),
  brand: document.querySelector("#brand"),
  productType: document.querySelector("#productType"),
  color: document.querySelector("#color"),
  material: document.querySelector("#material"),
  fit: document.querySelector("#fit"),
  capacity: document.querySelector("#capacity"),
  insulation: document.querySelector("#insulation"),
  lidStraw: document.querySelector("#lidStraw"),
  dimensions: document.querySelector("#dimensions"),
  packCount: document.querySelector("#packCount"),
  designFinish: document.querySelector("#designFinish"),
  useCase: document.querySelector("#useCase"),
  compatibility: document.querySelector("#compatibility"),
  batteries: document.querySelector("#batteries"),
  features: document.querySelector("#features"),
  care: document.querySelector("#care"),
  limited: document.querySelector("#limited"),
  additional: document.querySelector("#additional"),
};

const categoryConfigs = {
  clothing: {
    variables: ["productName", "brand", "productType", "color", "material", "fit", "additional"],
    templates: {
      standard: "{productName} is an easy everyday pick with a clean look and comfortable feel. {fit} {additional}",
      outdoor: "Built for active days and changing plans, {productName} is ready for quick errands, campus walks, and time outside. {fit} {additional}",
      premium: "{productName} makes a polished gift or personal pick, with a refined look that feels thoughtful and easy to wear. {additional}",
      student: "Easy to wear for class, campus, and weekends, {productName} keeps the look relaxed and comfortable. {fit} {additional}",
    },
  },
  drinkware: {
    variables: ["productName", "brand", "productType", "capacity", "material", "insulation", "lidStraw", "designFinish", "care", "additional"],
    templates: {
      standard: "{productName} is a practical {capacity} {productType} made for daily sipping. {insulation} {lidStraw} {additional}",
      outdoor: "Take {productName} along for class, errands, or weekend plans. The {capacity} size keeps drinks close wherever the day goes. {insulation} {care}",
      premium: "{productName} is a polished drinkware pick with a useful {capacity} size and a gift-ready look. {designFinish} {lidStraw}",
      student: "{productName} is easy to bring to class, the library, or a study session. {capacity} {additional}",
    },
  },
  gift: {
    variables: ["productName", "brand", "productType", "dimensions", "designFinish", "useCase", "additional"],
    templates: {
      standard: "{productName} is a thoughtful campus gift or everyday keepsake. {useCase} {additional}",
      outdoor: "{productName} brings school spirit to everyday plans, from campus events to weekend outings. {designFinish}",
      premium: "{productName} is a polished gift pick with a refined finish and easy display appeal. {additional}",
      student: "{productName} is a simple way to add school spirit to a room, desk, or daily routine. {useCase}",
    },
  },
  decal: {
    variables: ["productName", "brand", "productType", "dimensions", "designFinish", "additional"],
    templates: {
      standard: "{productName} adds school spirit to laptops, water bottles, notebooks, and more. {dimensions} {designFinish}",
      outdoor: "{productName} is ready for bottles, coolers, car windows, or gear that goes with you. {dimensions}",
      premium: "{productName} has a clean, giftable look that is easy to add to favorite everyday items. {designFinish}",
      student: "{productName} is an easy way to personalize class gear, laptops, and water bottles. {dimensions}",
    },
  },
  schoolSupply: {
    variables: ["productName", "brand", "productType", "packCount", "dimensions", "designFinish", "useCase", "additional"],
    templates: {
      standard: "{productName} is a useful school supply for {useCase}. {packCount} {dimensions} {additional}",
      outdoor: "{productName} keeps essentials ready for busy campus days, study sessions, and meetings. {useCase}",
      premium: "{productName} brings a polished touch to everyday organization and schoolwork. {packCount} {designFinish}",
      student: "{productName} is ready for class, studying, planning, and desk organization. {packCount} {useCase}",
    },
  },
  tech: {
    variables: ["productName", "brand", "productType", "compatibility", "batteries", "dimensions", "useCase", "additional"],
    templates: {
      standard: "{productName} is a useful tech accessory for {useCase}. {compatibility} {batteries}",
      outdoor: "{productName} helps keep everyday tech ready while you are on the move. {compatibility} {batteries}",
      premium: "{productName} is a practical gift for tech setups, study spaces, and daily carry. {compatibility}",
      student: "{productName} is ready for class, dorm rooms, study sessions, and everyday devices. {compatibility} {batteries}",
    },
  },
};

const approvedSnippets = [
  {
    id: "decalsOnly",
    label: "Decals Only",
    html: `<div id="do"/></div>`,
  },
  {
    id: "electronicsReturnPolicy",
    label: "Electronics Return Policy",
    html: `<div id="erp"/></div>`,
  },
  {
    id: "dropShip",
    label: "Drop Ship",
    html: `<div id="dropShip"</div>`,
  },
  {
    id: "aggiesBox",
    label: "Aggies Box",
    html: `<div id="aggiesBox"</div>`,
  },
  {
    id: "juliaGash",
    label: "Julia Gash",
    html: `<div id="juliaGash"</div>`,
  },
  {
    id: "artEvans",
    label: "Art Evans",
    html: `<div id="artEvans"</div>`,
  },
  {
    id: "firstGeneration",
    label: "First Generation",
    html: `<div id="aboutFirstGen" /></div>`,
  },
  {
    id: "semesterAtSeaDetails",
    label: "Semester at Sea Details",
    html: `<div id="semesterAtSeaDetails" /></div>`,
  },
  {
    id: "tokyodachi",
    label: "Tokyodachi",
    html: `<div id="tokyodachi"</div>`,
  },
  {
    id: "bookstoreExclusive",
    label: "Bookstore Exclusive",
    html: `<div id="bookstoreExclusive"</div>`,
  },
  {
    id: "operationHatTrick",
    label: "Operation Hat Trick",
    html: `<div id="opHatTruck"</div>`,
  },
  {
    id: "departmentOrders",
    label: "Department Orders",
    html: `<div id="departmentOrders"></div>`,
  },
  {
    id: "chokingHazard",
    label: "Choking Hazard",
    html: `<div id="chokingHazard"></div>`,
  },
  {
    id: "caProp65",
    label: "CA Prop 65",
    html: `<div id="CAProp65"></div>`,
  },
  {
    id: "bingeDrinking",
    label: "Binge Drinking",
    html: `<div id="bingeDrinking"></div>`,
  },
  {
    id: "coloradoOriginal",
    label: "Colorado Original",
    html: `<div id="coloradoOriginal"></div>`,
  },
  {
    id: "notDwSafe",
    label: "Not DW Safe",
    html: `<div id="notDWSafe"></div>`,
  },
  {
    id: "notMicrowaveSafe",
    label: "Not Microwave Safe",
    html: `<div id="notMWSafe"></div>`,
  },
  {
    id: "handWashOnly",
    label: "Hand Wash Only",
    html: `<div id="handWashOnly"></div>`,
  },
  {
    id: "storeStaffPick",
    label: "Store Staff Pick",
    html: `<div id="storeStaffPick"></div>`,
  },
  {
    id: "mountainCampus",
    label: "Mountain Campus",
    html: `<div id="mountainCampus"></div>`,
  },
];

const approvedSnippetDivIds = [
  "sa",
  ...approvedSnippets
    .map((snippet) => snippet.html.match(/<div\s+id="([^"]+)"/i)?.[1])
    .filter(Boolean),
];

function populateSnippetOptions() {
  approvedSnippets.forEach((snippet) => {
    const option = document.createElement("option");
    option.value = snippet.id;
    option.textContent = snippet.label;
    fields.snippet.appendChild(option);
  });
}

function getCategoryConfig() {
  return categoryConfigs[fields.category.value] || categoryConfigs.clothing;
}

function cleanValue(value) {
  return value.trim().replace(/\s+/g, " ");
}

function cleanTemplate(value) {
  return value.trim().replace(/[ \t]+/g, " ");
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeComment(value) {
  return cleanValue(value).replace(/--/g, "-").replace(/[<>]/g, "");
}

function getDateAdded() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function truncateToLimit(value, limit) {
  const cleaned = cleanValue(value);

  if (cleaned.length <= limit) {
    return cleaned;
  }

  const shortened = cleaned.slice(0, limit + 1).replace(/\s+\S*$/, "").trim();
  return shortened || cleaned.slice(0, limit).trim();
}

function titleCase(value) {
  return cleanValue(value).replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
}

function splitListItems(value) {
  return value
    .split(/\n|;|,/)
    .map((item) => cleanValue(item))
    .filter(Boolean);
}

function getProductNameHtml(data) {
  if (!data.productName) {
    return `<span class="productName">This product</span>`;
  }

  return `<span class="productName">${escapeHtml(data.productName)}</span>`;
}

function populateToneTemplate() {
  const config = getCategoryConfig();
  fields.descriptionTemplate.value = config.templates[fields.tone.value] || config.templates.standard;
}

function updateCategoryFields() {
  const category = fields.category.value;
  const config = getCategoryConfig();

  categoryFields.forEach((field) => {
    const categories = field.dataset.categories.split(" ");
    const isVisible = categories.includes(category);
    field.hidden = !isVisible;
    field.querySelectorAll("input, textarea, select").forEach((input) => {
      input.disabled = !isVisible;
    });
  });

  categoryVariableSummary.textContent = config.variables.map((variable) => `{${variable}}`).join(" ");
}

function cleanupGeneratedSentence(value) {
  return value
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+<br>/g, "<br>")
    .replace(/<br>\s+/g, "<br>")
    .trim();
}

function applyDescriptionTemplate(data) {
  const replacements = {
    brand: escapeHtml(data.brand),
    productType: escapeHtml(data.productType),
    color: escapeHtml(data.color),
    material: escapeHtml(data.material),
    fit: escapeHtml(data.fit),
    capacity: escapeHtml(data.capacity),
    insulation: escapeHtml(data.insulation),
    lidStraw: escapeHtml(data.lidStraw),
    dimensions: escapeHtml(data.dimensions),
    packCount: escapeHtml(data.packCount),
    designFinish: escapeHtml(data.designFinish),
    useCase: escapeHtml(data.useCase),
    compatibility: escapeHtml(data.compatibility),
    batteries: escapeHtml(data.batteries),
    care: escapeHtml(data.care),
    additional: escapeHtml(data.additional),
    productName: getProductNameHtml(data),
  };
  const template = cleanTemplate(data.descriptionTemplate || getCategoryConfig().templates.standard);
  const withTokens = template.replace(
    /\{(productName|brand|productType|color|material|fit|capacity|insulation|lidStraw|dimensions|packCount|designFinish|useCase|compatibility|batteries|care|additional)\}/g,
    (match, token) => replacements[token] || ""
  );
  const withProductName = withTokens.includes(`class="productName"`)
    ? withTokens
    : `${withTokens} ${getProductNameHtml(data)}`;

  return withProductName;
}

function buildDescriptionParagraphs(data) {
  return applyDescriptionTemplate(data)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\n/g, "<br>"))
    .map(cleanupGeneratedSentence)
    .filter(Boolean);
}

function buildFeatures(data) {
  const featureItems = splitListItems(data.features).map((text) => ({
    text,
    type: "plain",
  }));
  const automaticFeatureMap = {
    brand: ["Brand", data.brand],
    productType: ["Product type", data.productType],
    color: ["Color", data.color],
    material: ["Material", data.material],
    fit: ["Fit", data.fit],
    capacity: ["Capacity", data.capacity],
    insulation: ["Insulation", data.insulation],
    lidStraw: ["Lid / straw", data.lidStraw],
    dimensions: ["Dimensions", data.dimensions],
    packCount: ["Pack count", data.packCount],
    designFinish: ["Design / finish", data.designFinish],
    useCase: ["Use", data.useCase],
    compatibility: ["Compatibility", data.compatibility],
    batteries: ["Batteries / power", data.batteries],
  };
  const automaticItems = getCategoryConfig().variables
    .filter((variable) => automaticFeatureMap[variable])
    .map((variable) => {
      const [label, value] = automaticFeatureMap[variable];
      return value
        ? {
            label,
            value,
            type: "attribute",
          }
        : "";
    })
    .filter(Boolean);

  if (data.limited) {
    automaticItems.push({
      label: "Limited edition",
      value: data.limited,
      type: "attribute",
    });
  }

  if (data.studentAccountEligible) {
    automaticItems.push({
      label: "Student Account Eligible",
      value: "Yes",
      type: "attribute",
    });
  }

  const allItems = [...featureItems, ...automaticItems];

  if (!allItems.length) {
    return [
      {
        text: "Add product notes to generate feature bullets.",
        type: "plain",
      },
    ];
  }

  return allItems;
}

function buildFeatureListItem(item) {
  if (item.type === "attribute") {
    return `  <li><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.value)}</li>`;
  }

  return `  <li>${escapeHtml(item.text)}</li>`;
}

function getSelectedSnippetHtml(snippetId) {
  const snippet = approvedSnippets.find((item) => item.id === snippetId);
  return snippet ? snippet.html : "";
}

function getSelectedSnippetHtmlList(snippetIds) {
  return snippetIds.map(getSelectedSnippetHtml).filter(Boolean);
}

function buildHtml() {
  const data = getFormData();

  const employeeComment = sanitizeComment(data.employeeName);
  const introParagraphs = buildDescriptionParagraphs(data);
  const featureItems = buildFeatures(data);
  const html = [];

  if (employeeComment) {
    html.push(`<!-- Employee: ${employeeComment} -->`);
  }

  html.push(`<!-- Date Added: ${getDateAdded()} -->`);
  html.push(`<!--Version: ${appVersion} -->`);

  html.push(
    ...introParagraphs.map((paragraph) => `<p>${paragraph}</p>`),
    `<h3>Product Features</h3>`,
    `<ul class="prodFeatList">`,
    ...featureItems.map(buildFeatureListItem),
    `</ul>`
  );

  if (data.care) {
    html.push(`<h3>Care Instructions</h3>`);
    html.push(`<p>${escapeHtml(data.care)}</p>`);
  }

  html.push(...getSelectedSnippetHtmlList(data.snippet));

  if (data.studentAccountEligible) {
    html.push(`<div id="sa"></div>`);
  }

  return html.join("\n");
}

function getFormData() {
  return Object.fromEntries(
    Object.entries(fields).map(([key, input]) => {
      if (input.disabled) {
        return [key, input.multiple ? [] : ""];
      }

      if (input.type === "checkbox") {
        return [key, input.checked];
      }

      if (input.multiple) {
        return [key, Array.from(input.selectedOptions).map((option) => option.value)];
      }

      const preserveLineBreaks = key === "features" || key === "descriptionTemplate";
      return [key, preserveLineBreaks ? input.value.trim() : cleanValue(input.value)];
    })
  );
}

function isProductNameValid() {
  return fields.productName.value.length <= productNameLimit;
}

function getCategoryLabel(category) {
  const labels = {
    clothing: "Apparel",
    drinkware: "Drinkware",
    gift: "Gift",
    decal: "Decal",
    schoolSupply: "School Supply",
    tech: "Tech Accessory",
  };

  return labels[category] || "Product";
}

function uniqueList(items) {
  const seen = new Set();
  return items
    .map(cleanValue)
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function buildSeoTitle(data) {
  const categoryLabel = getCategoryLabel(data.category);
  const pieces = [data.brand, data.productName || data.productType, data.color, data.productType, categoryLabel];
  return truncateToLimit(uniqueList(pieces).join(" "), seoTitleLimit);
}

function buildMetaDescription(data) {
  const category = data.category;
  const product = data.productName || data.productType || "This product";
  const productType = data.productType || getCategoryLabel(category).toLowerCase();
  let sentence = `${product} is a ${data.color ? `${data.color} ` : ""}${productType}`;
  let details = [];

  if (category === "clothing") {
    details = [data.material ? `made with ${data.material}` : "", data.fit || ""];
  } else if (category === "drinkware") {
    details = [data.capacity ? `with ${data.capacity} capacity` : "", data.material || "", data.insulation || "", data.lidStraw || ""];
  } else if (category === "gift") {
    details = [data.useCase ? `for ${data.useCase}` : "for gifting", data.designFinish || ""];
  } else if (category === "tech") {
    details = [data.compatibility ? `for ${data.compatibility}` : "", data.batteries || "", data.useCase || ""];
  } else if (category === "schoolSupply") {
    details = [data.packCount || "", data.useCase ? `for ${data.useCase}` : "", data.dimensions || ""];
  } else {
    details = [data.dimensions || "", data.designFinish || ""];
  }

  const detailText = details.map(cleanValue).filter(Boolean).join(", ");

  if (detailText) {
    sentence += ` ${detailText}`;
  }

  return truncateToLimit(`${sentence}.`, metaDescriptionLimit);
}

function buildSearchKeywords(data) {
  const campusTerms = ["CSU", "Colorado State", "Rams", "campus store"];
  const categoryTerms = {
    clothing: ["apparel", "campus apparel", "college clothing", data.fit, data.material],
    drinkware: ["drinkware", "tumbler", "water bottle", data.capacity, data.material, data.insulation, data.lidStraw, "lid", "straw", "insulated"],
    gift: ["gift", "college gift", "campus gift", data.useCase, data.designFinish],
    decal: ["decal", "sticker", "laptop sticker", "water bottle sticker", data.dimensions],
    schoolSupply: ["school supply", "class supplies", "desk supplies", data.packCount, data.useCase, data.dimensions, "pack"],
    tech: ["tech accessory", "electronics", data.compatibility, data.batteries, data.useCase],
  };
  const baseTerms = [
    data.productName,
    data.brand,
    data.productType,
    getCategoryLabel(data.category),
    data.color,
    data.material,
    data.fit,
    data.capacity,
    data.insulation,
    data.lidStraw,
    data.dimensions,
    data.packCount,
    data.designFinish,
    data.useCase,
    data.compatibility,
    ...splitListItems(data.features || "").slice(0, 4),
    ...campusTerms,
    ...(categoryTerms[data.category] || []),
  ];

  return uniqueList(baseTerms).slice(0, 20).join(", ");
}

function buildMetadata(data) {
  return {
    seoTitle: buildSeoTitle(data),
    metaDescription: buildMetaDescription(data),
    searchKeywords: buildSearchKeywords(data),
  };
}

function updateMetadataCounts() {
  seoTitleCounter.textContent = `${seoTitle.value.length} / ${seoTitleLimit}`;
  seoTitleCounter.classList.toggle("is-over", seoTitle.value.length > seoTitleLimit);
  metaDescriptionCounter.textContent = `${metaDescription.value.length} / ${metaDescriptionLimit}`;
  metaDescriptionCounter.classList.toggle("is-over", metaDescription.value.length > metaDescriptionLimit);
}

function updateMetadata(data) {
  const metadata = buildMetadata(data);

  if (!metadataDirty.seoTitle) {
    seoTitle.value = metadata.seoTitle;
  }

  if (!metadataDirty.metaDescription) {
    metaDescription.value = metadata.metaDescription;
  }

  if (!metadataDirty.searchKeywords) {
    searchKeywords.value = metadata.searchKeywords;
  }

  updateMetadataCounts();
}

function validateApprovedOutput(html) {
  const allowedBasicTags = ["p", "h3", "h4", "ul", "li", "strong", "em", "br"];
  const tags = [...html.matchAll(/<(\/?)([a-z0-9]+)\b([^>]*)>/gi)];

  return tags.every((match) => {
    const isClosingTag = match[1] === "/";
    const tagName = match[2].toLowerCase();
    const attributes = match[3].trim();

    if (allowedBasicTags.includes(tagName) && tagName !== "ul") {
      return true;
    }

    if (tagName === "ul") {
      return isClosingTag || attributes === "" || attributes === `class="prodFeatList"`;
    }

    if (isClosingTag && (tagName === "span" || tagName === "div")) {
      return true;
    }

    if (tagName === "span") {
      return attributes === `class="productName"`;
    }

    if (tagName === "div") {
      const idMatch = attributes.match(/^id="([^"]+)"\s*\/?$/);
      return Boolean(idMatch && approvedSnippetDivIds.includes(idMatch[1]));
    }

    return false;
  });
}

function updateProductNameLimitState() {
  const count = fields.productName.value.length;
  const isOverLimit = count > productNameLimit;

  productNameCounter.textContent = `${count} / ${productNameLimit}`;
  productNameCounter.classList.toggle("is-over", isOverLimit);
  fields.productName.classList.toggle("is-invalid", isOverLimit);
  productNameWarning.textContent = isOverLimit
    ? "Product Name must be 60 characters or fewer before copying."
    : "";
}

function updateOutput() {
  const data = getFormData();
  const generatedHtml = buildHtml();
  const outputIsValid = validateApprovedOutput(generatedHtml);

  htmlOutput.value = generatedHtml;
  preview.innerHTML = generatedHtml;
  updateMetadata(data);
  updateProductNameLimitState();
  copyButton.disabled = !isProductNameValid() || !outputIsValid;
  copyStatus.textContent = outputIsValid ? "" : "Output includes an unapproved tag. Check the approved snippets list.";
}

async function copyHtml() {
  if (!isProductNameValid()) {
    copyStatus.textContent = "Shorten the Product Name to 60 characters or fewer before copying.";
    fields.productName.focus();
    return;
  }

  try {
    await navigator.clipboard.writeText(htmlOutput.value);
    copyStatus.textContent = "HTML copied to clipboard.";
  } catch (error) {
    htmlOutput.focus();
    htmlOutput.select();
    document.execCommand("copy");
    copyStatus.textContent = "HTML selected and copied.";
  }
}

async function copyPlainTextFromElement(element, statusElement) {
  try {
    await navigator.clipboard.writeText(element.value);
    statusElement.textContent = "Copied.";
  } catch (error) {
    element.focus();
    element.select();
    document.execCommand("copy");
    statusElement.textContent = "Selected and copied.";
  }
}

function resetMetadataDirtyState() {
  Object.keys(metadataDirty).forEach((key) => {
    metadataDirty[key] = false;
  });
}

function insertTextAtCursor(textarea, text) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  textarea.value = `${textarea.value.slice(0, start)}${text}${textarea.value.slice(end)}`;
  textarea.selectionStart = start + text.length;
  textarea.selectionEnd = start + text.length;
}

form.addEventListener("input", updateOutput);
fields.descriptionTemplate.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    insertTextAtCursor(fields.descriptionTemplate, "\n\n");
    fields.descriptionTemplate.dispatchEvent(new Event("input", { bubbles: true }));
  }
});
fields.category.addEventListener("change", () => {
  updateCategoryFields();
  populateToneTemplate();
  resetMetadataDirtyState();
  updateOutput();
});
fields.tone.addEventListener("change", () => {
  populateToneTemplate();
  updateOutput();
});
seoTitle.addEventListener("input", () => {
  metadataDirty.seoTitle = true;
  updateMetadataCounts();
});
metaDescription.addEventListener("input", () => {
  metadataDirty.metaDescription = true;
  updateMetadataCounts();
});
searchKeywords.addEventListener("input", () => {
  metadataDirty.searchKeywords = true;
});
metadataCopyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.querySelector(`#${button.dataset.copyTarget}`);
    copyPlainTextFromElement(target, metadataCopyStatus);
  });
});
copyButton.addEventListener("click", copyHtml);
resetButton.addEventListener("click", () => {
  form.reset();
  resetMetadataDirtyState();
  updateCategoryFields();
  populateToneTemplate();
  updateOutput();
  fields.productName.focus();
});

populateSnippetOptions();
updateCategoryFields();
populateToneTemplate();
updateOutput();
