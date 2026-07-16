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
const customAttributes = document.querySelector("#customAttributes");
const addCustomAttributeButton = document.querySelector("#addCustomAttributeButton");
let descriptionEditor = null;

const productNameLimit = 60;
const seoTitleLimit = 60;
const metaDescriptionLimit = 155;
const appVersion = "1.1";
const metadataDirty = {
  seoTitle: false,
  metaDescription: false,
  searchKeywords: false,
};

const fields = {
  employeeName: document.querySelector("#employeeName"),
  tone: document.querySelector("#tone"),
  category: document.querySelector("#category"),
  editorialLead: document.querySelector("#editorialLead"),
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
  decalSize: document.querySelector("#decalSize"),
  packCount: document.querySelector("#packCount"),
  designFinish: document.querySelector("#designFinish"),
  useCase: document.querySelector("#useCase"),
  compatibility: document.querySelector("#compatibility"),
  batteries: document.querySelector("#batteries"),
  features: document.querySelector("#features"),
  care: document.querySelector("#care"),
};

const categoryConfigs = {
  clothing: {
    variables: ["productName", "brand", "productType", "color", "material", "fit"],
    templates: {
      standard: "{productName} is an easy everyday pick with a clean look and comfortable feel. {fit}",
      outdoor: "Built for active days and changing plans, {productName} is ready for quick errands, campus walks, and time outside. {fit}",
      premium: "{productName} makes a polished gift or personal pick, with a refined look that feels thoughtful and easy to wear.",
      student: "Easy to wear for class, campus, and weekends, {productName} keeps the look relaxed and comfortable. {fit}",
    },
  },
  drinkware: {
    variables: ["productName", "brand", "productType", "capacity", "material", "insulation", "lidStraw", "designFinish", "care"],
    templates: {
      standard: "{productName} is a practical {capacity} {productType} made for daily sipping. {insulation} {lidStraw}",
      outdoor: "Take {productName} along for class, errands, or weekend plans. The {capacity} size keeps drinks close wherever the day goes. {insulation} {care}",
      premium: "{productName} is a polished drinkware pick with a useful {capacity} size and a gift-ready look. {designFinish} {lidStraw}",
      student: "{productName} is easy to bring to class, the library, or a study session. {capacity}",
    },
  },
  gift: {
    variables: ["productName", "brand", "productType", "dimensions", "designFinish", "useCase"],
    templates: {
      standard: "{productName} is a thoughtful campus gift or everyday keepsake. {useCase}",
      outdoor: "{productName} brings school spirit to everyday plans, from campus events to weekend outings. {designFinish}",
      premium: "{productName} is a polished gift pick with a refined finish and easy display appeal.",
      student: "{productName} is a simple way to add school spirit to a room, desk, or daily routine. {useCase}",
    },
  },
  decal: {
    variables: ["productName", "brand", "productType", "decalSize", "designFinish"],
    templates: {
      standard: "{productName} adds school spirit to laptops, water bottles, notebooks, and more. {decalSize} {designFinish}",
      outdoor: "{productName} is ready for bottles, coolers, car windows, or gear that goes with you. {decalSize}",
      premium: "{productName} has a clean, giftable look that is easy to add to favorite everyday items. {designFinish}",
      student: "{productName} is an easy way to personalize class gear, laptops, and water bottles. {decalSize}",
    },
  },
  schoolSupply: {
    variables: ["productName", "brand", "productType", "packCount", "dimensions", "designFinish", "useCase"],
    templates: {
      standard: "{productName} is a useful school supply for {useCase}. {packCount} {dimensions}",
      outdoor: "{productName} keeps essentials ready for busy campus days, study sessions, and meetings. {useCase}",
      premium: "{productName} brings a polished touch to everyday organization and schoolwork. {packCount} {designFinish}",
      student: "{productName} is ready for class, studying, planning, and desk organization. {packCount} {useCase}",
    },
  },
  tech: {
    variables: ["productName", "brand", "productType", "compatibility", "batteries", "dimensions", "useCase"],
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
    html: `<div id="do"></div>`,
  },
  {
    id: "electronicsReturnPolicy",
    label: "Electronics Return Policy",
    html: `<div id="erp"></div>`,
  },
  {
    id: "dropShip",
    label: "Drop Ship",
    html: `<div id="dropShip"></div>`,
  },
  {
    id: "aggiesBox",
    label: "Aggies Box",
    html: `<div id="aggiesBox"></div>`,
  },
  {
    id: "juliaGash",
    label: "Julia Gash",
    html: `<div id="juliaGash"></div>`,
  },
  {
    id: "artEvans",
    label: "Art Evans",
    html: `<div id="artEvans"></div>`,
  },
  {
    id: "firstGeneration",
    label: "First Generation",
    html: `<div id="aboutFirstGen"></div>`,
  },
  {
    id: "semesterAtSeaDetails",
    label: "Semester at Sea Details",
    html: `<div id="semesterAtSeaDetails"></div>`,
  },
  {
    id: "tokyodachi",
    label: "Tokyodachi",
    html: `<div id="tokyodachi"></div>`,
  },
  {
    id: "bookstoreExclusive",
    label: "Bookstore Exclusive",
    html: `<div id="bookstoreExclusive"></div>`,
  },
  {
    id: "operationHatTrick",
    label: "Operation Hat Trick",
    html: `<div id="opHatTruck"></div>`,
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
    .split(/\n|;/)
    .map((item) => cleanValue(item))
    .filter(Boolean);
}

function getProductNameHtml(data) {
  if (!data.productName) {
    return `<span class="productName">This product</span>`;
  }

  return `<span class="productName">${escapeHtml(data.productName)}</span>`;
}

function getToneTemplateText() {
  const config = getCategoryConfig();
  return config.templates[fields.tone.value] || config.templates.standard;
}

function getToneTemplateHtml() {
  return `<p>${escapeHtml(getToneTemplateText())}</p>`;
}

function setDescriptionEditorContent(html) {
  fields.descriptionTemplate.value = html;

  if (descriptionEditor) {
    descriptionEditor.setContent(html);
    descriptionEditor.save();
  }
}

function populateToneTemplate() {
  const content = descriptionEditor ? getToneTemplateHtml() : getToneTemplateText();
  setDescriptionEditorContent(content);
}

function addCustomAttributeRow(label = "", value = "") {
  const row = document.createElement("div");
  row.className = "custom-attribute-row";
  row.innerHTML = `
    <input class="form-control custom-attribute-label" type="text" placeholder="Label, e.g. Capacity" value="${escapeHtml(label)}">
    <input class="form-control custom-attribute-value" type="text" placeholder="Value, e.g. 20 oz." value="${escapeHtml(value)}">
    <button type="button" class="btn btn-outline-secondary btn-sm custom-attribute-remove" aria-label="Remove custom attribute">Remove</button>
  `;
  customAttributes.appendChild(row);
}

function getCustomAttributes() {
  return [...customAttributes.querySelectorAll(".custom-attribute-row")]
    .map((row) => ({
      label: cleanValue(row.querySelector(".custom-attribute-label").value),
      value: cleanValue(row.querySelector(".custom-attribute-value").value),
      type: "attribute",
    }))
    .filter((item) => item.label && item.value);
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

function isSafeLink(href) {
  try {
    const url = new URL(href, window.location.href);
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol);
  } catch (error) {
    return false;
  }
}

function sanitizeRichDescription(html) {
  const source = document.createElement("template");
  const output = document.createElement("div");
  source.innerHTML = html;

  function appendCleanNode(node, parent) {
    if (node.nodeType === Node.TEXT_NODE) {
      parent.appendChild(document.createTextNode(node.textContent));
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const tagName = node.tagName.toLowerCase();
    const allowedTags = ["p", "strong", "em", "br", "a"];

    if (!allowedTags.includes(tagName)) {
      node.childNodes.forEach((child) => appendCleanNode(child, parent));
      return;
    }

    if (tagName === "a" && !isSafeLink(node.getAttribute("href") || "")) {
      node.childNodes.forEach((child) => appendCleanNode(child, parent));
      return;
    }

    const cleanElement = document.createElement(tagName);

    if (tagName === "a") {
      cleanElement.setAttribute("href", node.getAttribute("href"));

      if (node.getAttribute("target") === "_blank") {
        cleanElement.setAttribute("target", "_blank");
        cleanElement.setAttribute("rel", "noopener noreferrer");
      }
    }

    node.childNodes.forEach((child) => appendCleanNode(child, cleanElement));
    parent.appendChild(cleanElement);
  }

  source.content.childNodes.forEach((node) => appendCleanNode(node, output));
  return output.innerHTML;
}

function buildRichDescription(data) {
  const rawTemplate = data.descriptionTemplate || getToneTemplateText();
  let sanitizedTemplate = sanitizeRichDescription(rawTemplate).replace(/\{additional\}/g, "");

  if (!/<p\b/i.test(sanitizedTemplate)) {
    sanitizedTemplate = `<p>${sanitizedTemplate}</p>`;
  }
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
    decalSize: escapeHtml(data.decalSize),
    packCount: escapeHtml(data.packCount),
    designFinish: escapeHtml(data.designFinish),
    useCase: escapeHtml(data.useCase),
    compatibility: escapeHtml(data.compatibility),
    batteries: escapeHtml(data.batteries),
    care: escapeHtml(data.care),
    productName: getProductNameHtml(data),
  };
  let withTokens = sanitizedTemplate.replace(
    /\{(productName|brand|productType|color|material|fit|capacity|insulation|lidStraw|dimensions|decalSize|packCount|designFinish|useCase|compatibility|batteries|care)\}/g,
    (match, token) => replacements[token] || ""
  );

  if (!withTokens.includes(`class="productName"`)) {
    withTokens += `<p>${getProductNameHtml(data)}</p>`;
  }

  return withTokens;
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
    decalSize: ["Decal size", data.decalSize],
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

  if (data.studentAccountEligible) {
    automaticItems.push({
      label: "Student Account Eligible",
      value: "Yes",
      type: "attribute",
    });
  }

  const allItems = [...featureItems, ...automaticItems, ...data.customAttributes];

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

function splitFeatureItems(featureItems) {
  return {
    plainItems: featureItems.filter((item) => item.type !== "attribute"),
    attributeItems: featureItems.filter((item) => item.type === "attribute"),
  };
}

function buildFeatureListItem(item, indent = "  ") {
  if (item.type === "attribute") {
    return `${indent}<li><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.value)}</li>`;
  }

  return `${indent}<li>${escapeHtml(item.text)}</li>`;
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
  const editorialLead = cleanValue(data.editorialLead);
  const richDescription = buildRichDescription(data);
  const featureItems = buildFeatures(data);
  const { plainItems, attributeItems } = splitFeatureItems(featureItems);
  const html = [];

  if (employeeComment) {
    html.push(`<!-- Employee: ${employeeComment} -->`);
  }

  html.push(`<!-- Date Added: ${getDateAdded()} -->`);
  html.push(`<!--Version: ${appVersion} -->`);

  const listingHtml = [
    `<div class="csuProdDesc">`,
    `  <div class="bk-product-copy">`,
  ];

  if (editorialLead) {
    listingHtml.push(`    <p class="lead">${escapeHtml(editorialLead)}</p>`);
  }

  listingHtml.push(
    richDescription
      .split("\n")
      .filter(Boolean)
      .map((line) => `    ${line}`)
      .join("\n"),
    `    <div class="bk-product-features">`,
    `      <h3>Product Features</h3>`
  );

  if (plainItems.length) {
    listingHtml.push(
      `      <ul class="prodFeatList">`,
      ...plainItems.map((item) => buildFeatureListItem(item, "        ")),
      `      </ul>`
    );
  }

  listingHtml.push(...getSelectedSnippetHtmlList(data.snippet).map((snippetHtml) => `    ${snippetHtml}`));

  if (data.studentAccountEligible) {
    listingHtml.push(`    <div id="sa"></div>`);
  }

  listingHtml.push(`    </div>`, `  </div>`);

  if (attributeItems.length || data.care) {
    listingHtml.push(`  <div class="bk-product-details">`);
  }

  if (attributeItems.length) {
    listingHtml.push(
      `    <h4>Product Specifications</h4>`,
      `    <div class="attribute">`,
      `      <ul>`,
      ...attributeItems.map((item) => buildFeatureListItem(item, "        ")),
      `      </ul>`,
      `    </div>`
    );
  }

  if (data.care) {
    listingHtml.push(
      `    <div class="bk-care-instructions">`,
      `      <h3>Care Instructions</h3>`,
      `      <p>${escapeHtml(data.care)}</p>`,
      `    </div>`
    );
  }

  if (attributeItems.length || data.care) {
    listingHtml.push(`  </div>`);
  }

  listingHtml.push(`</div>`);
  html.push(...listingHtml);

  return html.join("\n");
}

function getFormData() {
  const data = Object.fromEntries(
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

      if (key === "descriptionTemplate" && descriptionEditor) {
        return [key, descriptionEditor.getContent()];
      }

      const preserveLineBreaks = key === "features" || key === "descriptionTemplate";
      return [key, preserveLineBreaks ? input.value.trim() : cleanValue(input.value)];
    })
  );

  data.customAttributes = getCustomAttributes();
  return data;
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
  return data.productName;
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
  } else if (category === "decal") {
    details = [data.decalSize || "", data.designFinish || ""];
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
    decal: ["decal", "sticker", "laptop sticker", "water bottle sticker", data.decalSize],
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
    data.decalSize,
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
  const allowedBasicTags = ["h3", "h4", "li", "strong", "em", "br"];
  const tags = [...html.matchAll(/<(\/?)([a-z0-9]+)\b([^>]*)>/gi)];

  return tags.every((match) => {
    const isClosingTag = match[1] === "/";
    const tagName = match[2].toLowerCase();
    const attributes = match[3].trim();

    if (allowedBasicTags.includes(tagName)) {
      return true;
    }

    if (tagName === "p") {
      return isClosingTag || attributes === "" || attributes === `class="lead"`;
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

    if (tagName === "a") {
      if (isClosingTag) {
        return true;
      }

      const hrefMatch = attributes.match(/(?:^|\s)href="([^"]+)"/);
      const allowedAttributes = attributes
        .replace(/(?:^|\s)href="[^"]+"/g, "")
        .replace(/(?:^|\s)target="_blank"/g, "")
        .replace(/(?:^|\s)rel="noopener noreferrer"/g, "")
        .trim();
      return Boolean(hrefMatch && isSafeLink(hrefMatch[1]) && allowedAttributes === "");
    }

    if (tagName === "div") {
      if (
        [
          `class="csuProdDesc"`,
          `class="bk-product-copy"`,
          `class="bk-product-features"`,
          `class="bk-product-details"`,
          `class="attribute"`,
          `class="bk-care-instructions"`,
        ].includes(attributes)
      ) {
        return true;
      }

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

function initializeDescriptionEditor() {
  if (!window.tinymce) {
    return;
  }

  window.tinymce.init({
    selector: "#descriptionTemplate",
    license_key: "gpl",
    menubar: false,
    plugins: "autolink link",
    toolbar: "undo redo | bold italic | link unlink | removeformat",
    statusbar: false,
    branding: false,
    promotion: false,
    height: 220,
    convert_urls: false,
    valid_elements: "p,strong,em,br,a[href|target|rel]",
    setup(editor) {
      editor.on("init", () => {
        descriptionEditor = editor;
        editor.setContent(getToneTemplateHtml());
        editor.save();
        updateOutput();
      });

      editor.on("change input undo redo", () => {
        editor.save();
        updateOutput();
      });
    },
  });
}

form.addEventListener("input", updateOutput);
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
addCustomAttributeButton.addEventListener("click", () => {
  addCustomAttributeRow();
  updateOutput();
  customAttributes.querySelector(".custom-attribute-row:last-child .custom-attribute-label").focus();
});
customAttributes.addEventListener("click", (event) => {
  if (!event.target.classList.contains("custom-attribute-remove")) {
    return;
  }

  event.target.closest(".custom-attribute-row").remove();
  updateOutput();
});
copyButton.addEventListener("click", copyHtml);
resetButton.addEventListener("click", () => {
  form.reset();
  customAttributes.innerHTML = "";
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
initializeDescriptionEditor();
