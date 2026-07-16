# Product Description HTML Builder

A simple local web app for student employees who need to turn product listing notes into clean HTML for MBS/Insite product descriptions.

**Current version:** 1.1

## Files

- `index.html` - app structure and form fields
- `style.css` - Bootstrap-friendly custom styling
- `script.js` - live preview, approved HTML generation, copy, and reset behavior

## How to Use

Open `index.html` in a browser, fill in the product notes, then copy the generated HTML from the output box.

The generated HTML uses only these approved tags:

- `p`
- `h3`
- `ul`
- `li`
- `strong`
- `em`
- `br`
- `a` with a safe `http`, `https`, `mailto`, or `tel` URL
- `h4` for approved snippets
- `span` only when it is exactly `<span class="productName">...</span>`
- `ul` may include `class="prodFeatList"` for Product Features lists
- `div` may include `class="csuProdDesc"` around the full listing
- `div` may include layout wrappers: `bk-product-copy`, `bk-product-features`, `bk-product-details`, `attribute`, and `bk-care-instructions`
- `p` may include `class="lead"` for the optional Editorial Lead
- `div` only for approved snippet IDs and the Student Account Eligible snippet: `<div id="sa"></div>`

The generator escapes typed notes so accidental HTML, styles, scripts, and unapproved tags do not get included in the output.

## Output Format

The app creates:

- A short paragraph description
- A `Product Features` heading
- A bullet list using `<ul class="prodFeatList">`
- Optional Editorial Lead output as `<p class="lead">...</p>`
- Product specifications grouped in `<div class="attribute">`
- A wrapped Care Instructions section when care information is entered
- Optional approved code snippets inside the product copy section
- The Student Account Eligible snippet inside the product copy section when the checkbox is selected
- Editable suggested metadata for SEO title, meta description, and search keywords

The product description content is grouped for future CSS layout work:

```html
<div class="csuProdDesc">
  <div class="bk-product-copy">
    <p class="lead">A soft, everyday layer for cool mornings and game day plans.</p>
    <p><span class="productName">CSU Rams Hoodie</span> is an easy everyday pick.</p>
    <div class="bk-product-features">
      <h3>Product Features</h3>
      <ul class="prodFeatList">
        <li>Kangaroo pocket</li>
      </ul>
    </div>
    <div id="departmentOrders"></div>
    <div id="sa"></div>
  </div>
  <div class="bk-product-details">
    <div class="attribute">
      <ul>
        <li><strong>Brand:</strong> Champion</li>
      </ul>
    </div>
    <div class="bk-care-instructions">
      <h3>Care Instructions</h3>
      <p>Machine wash cold. Tumble dry low.</p>
    </div>
  </div>
</div>
```

These wrappers separate editorial copy, product features, product specifications, and care instructions.

Tone presets fill the editable description text field. Students can revise that text before copying so product listings do not all sound the same.

## Suggested Metadata

The app generates editable metadata suggestions locally in the browser. It does not call external APIs.

Suggested Metadata includes:

- SEO Title, copied directly from Product Name with a 60-character live counter
- Meta Description, limited to 155 characters with a live counter
- Search Keywords, generated as 10-20 natural comma-separated terms

Metadata generation is category-aware:

- Apparel emphasizes fit, color, material, and brand.
- Drinkware emphasizes capacity, material, insulation, and lid/straw details.
- Gifts emphasize use case, design, and recipient-friendly wording.
- Tech emphasizes compatibility, batteries, and use case.
- School supplies emphasize pack count, dimensions, and use case.

The metadata fields are editable before copying. Once a metadata field is manually edited, the app leaves that field alone until reset or category change.

## Product Categories

The Product Category dropdown changes the helpful fields and variables shown in the form.

Current categories are:

- Clothing
- Drinkware
- Gift / General Merchandise
- Decals
- School Supply
- Tech / Accessory

Category setup lives in the `categoryConfigs` object in `script.js`. Each category has:

- `variables` - the variables shown to students and used for automatic feature bullets
- `templates` - starter editable description text for each tone preset

To add a category, add one entry to `categoryConfigs`, add an `<option>` in `index.html`, and add any needed fields to the Category Details section.

## Product Features Formatting

The Product Features list is generated as:

```html
<ul class="prodFeatList">
```

The `prodFeatList` class is intentionally not styled in this app yet. It is included so the design team can define the list styling later in MBS/Insite or another shared stylesheet.

Automatic attribute bullets use a consistent helper in `script.js`, so labels are bolded the same way throughout the list:

```html
<li><strong>Brand:</strong> Champion</li>
<li><strong>Product type:</strong> Hooded Sweatshirt</li>
```

Student-entered feature bullets remain plain list items unless they are entered through a structured field.

Feature notes split into separate bullets on new lines or semicolons. Commas remain inside the same bullet, so text like `Great for breakfast, lunch, or dinner` stays together.

Freeform Product Attributes let employees add extra specification bullets such as `Capacity: 20 oz.`, `Pages: 200`, or `Includes: Stylus and charging cable`. These are included in the same `<div class="attribute">` block as the standard product specifications.

## Tone Presets and Editable Description Text

Tone preset starter copy lives inside each category in the `categoryConfigs` object in `script.js`.

Each preset fills the `Editable Description Text` field with starter copy. The generated first paragraph comes from this editable field, not directly from the preset dropdown.

Use these placeholders to insert product data into the description:

- `{productName}` - inserts the product name as `<span class="productName">...</span>`
- `{brand}`
- `{productType}`
- `{color}`
- `{material}`
- `{fit}`
- `{capacity}`
- `{insulation}`
- `{lidStraw}`
- `{dimensions}`
- `{decalSize}`
- `{packCount}`
- `{designFinish}`
- `{useCase}`
- `{compatibility}`
- `{batteries}`
- `{care}`

Example template:

```text
Easy to wear for class and weekends, {productName} is a comfortable {productType} in {color}. {fit}
```

If `{productName}` is removed from the editable text, the app appends the product name span to the end of the paragraph so the product name is still included.

Pressing Enter in the editable description creates a new `<p>` paragraph. Pressing Shift+Enter creates a `<br>` line break inside the current paragraph.

## Rich Text Editing

The editable description uses TinyMCE 8, loaded through jsDelivr. Its toolbar supports:

- Undo and redo
- Bold and italic text
- Adding and removing links
- Removing formatting

Rich text output is sanitized before it reaches the generated HTML. Only paragraphs, bold, italic, line breaks, and safe links are retained. Inline styles, scripts, images, and other markup are removed.

If TinyMCE cannot load, the original textarea remains available as a plain-text fallback.

## Code Snippets

Approved reusable snippets live in the `approvedSnippets` list in `script.js`.

To add or edit a snippet, update one object in that list:

```js
{
  id: "uniqueSnippetId",
  label: "Dropdown Label",
  html: `<h4>approvedSnippetCode</h4>`,
}
```

The dropdown is filled automatically from this list and allows multiple selections. On Mac, use Command-click to select more than one snippet. The validator allows trusted `<h4>` snippets and approved `<div id="...">` snippets from this list, while student-entered form notes are still escaped.

Current approved dropdown snippets:

- Decals Only
- Electronics Return Policy
- Drop Ship
- Aggies Box
- Julia Gash
- Art Evans
- First Generation
- Semester at Sea Details
- Tokyodachi
- Bookstore Exclusive
- Operation Hat Trick
- Department Orders
- Choking Hazard
- CA Prop 65
- Binge Drinking
- Colorado Original
- Not DW Safe
- Not Microwave Safe
- Hand Wash Only
- Store Staff Pick
- Mountain Campus

## Student Account Eligible

The `Student Account Eligible` checkbox appends this exact HTML inside the `.bk-product-copy` wrapper:

```html
<div id="sa"></div>
```

This is intentionally handled as an approved exception. Student-entered notes are still escaped, so typing a `div`, `script`, style, or other markup into a form field will not become live HTML.

When selected, the Product Features list also includes:

```html
<li><strong>Student Account Eligible:</strong> Yes</li>
```

## Employee Comment

The Employee Name field inserts an HTML comment at the start of the generated HTML:

```html
<!-- Employee: Taylor -->
```

## Product Name Limit

The Product Name field has a 60-character limit for copying. The app shows a live counter next to the field.

If the Product Name is longer than 60 characters:

- The warning appears below the field.
- The copy button is disabled.
- The app does not silently shorten or change the Product Name.

Shorten the Product Name to 60 characters or fewer to copy the generated HTML.
