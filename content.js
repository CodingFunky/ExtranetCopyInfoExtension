chrome.storage.sync.get("disabled", (data) => {
  if (!data.disabled) {
    // Extension is enabled; proceed with the script's functionality

    // ORDER ID COPY BUTTON
    const element = document.querySelector(".v-page-title");
    if (element) {
      // Check if the text contains an order number
      const orderText = element.innerText
        .split(" ")
        .find((text) => text.startsWith("#"));
      const orderNumberMatch = orderText ? orderText.match(/\d+/) : null;

      if (orderNumberMatch) {
        // Create the button only if an order number is found
        const button = document.createElement("button");
        button.classList.add("order-id-copy-button");
        button.classList.add("background-emerald-pale");
        button.innerText = "Copy";
        const originalText = button.innerText;

        // Set the button's onclick functionality
        button.onclick = function () {
          navigator.clipboard.writeText(orderNumberMatch[0]);
          button.innerText = "Copied!";
          setTimeout(() => {
            button.innerText = originalText;
          }, 2000); // Change back after 2 seconds
        };

        // Append the button to the element
        element.appendChild(button);
      }
    }

    // ADDS COPY BUTTON TO ALL TABLE ELEMENTS **TEMP**
    document.querySelectorAll("tr").forEach((tr) => {
      tr.querySelectorAll("td").forEach((td) => {
        // Create a copy button
        const copyBtn = document.createElement("button");
        copyBtn.innerHTML = '<i class="far fa-copy"></i>'; // Use an actual icon or image in a real implementation
        copyBtn.style.cursor = "pointer";
        copyBtn.style.marginLeft = "5px";
        copyBtn.style.border = "none";
        copyBtn.style.background = "none";
        copyBtn.style.opacity = "0";
        copyBtn.style.transition = "opacity 0.3s"; // Smooth transition for opacity change

        copyBtn.onclick = function () {
          let textToCopy = "";

          console.log("clicked");
          // Check if the text contains a ticket number pattern ("T" followed by numbers)
          if (/T\d+/.test(td.textContent)) {
            // Splitting text content based on the pattern "T" followed by numbers
            const parts = td.textContent.split(/(T\d+)/);
            if (parts.length > 1) {
              // The first part will be the text before the ticket number
              textToCopy = parts[0].trim();
            }
          } else if (td.classList.contains("text-right")) {
            // Targeting the grand total cell by finding the last numeric value
            // This regex matches any sequence of digits possibly containing commas and followed by a decimal point with two digits
            const amounts = td.textContent.match(/\d{1,3}(,\d{3})*\.\d{2}/g);
            if (amounts && amounts.length > 0) {
              // The last match is assumed to be the grand total
              const grandTotal = amounts[amounts.length - 1];
              textToCopy = grandTotal; // This is the last numeric value, which should be the grand total
            }
          } else {
            // Replace sequences of whitespace characters with a single space and then trim
            textToCopy = td.textContent.replace(/\s+/g, " ").trim();
          }

          // Remove the clipboard icon "📋" from the end of the text
          textToCopy = textToCopy.replace(/📋$/u, "");
          textToCopy = textToCopy.replace(/✅$/u, "");
          console.log(textToCopy);

          // Copy accumulated text to clipboard
          navigator.clipboard.writeText(textToCopy).then(() => {
            // Provide feedback that text was copied
            const originalContent = copyBtn.innerHTML;
            copyBtn.style.opacity = "0";
            setTimeout(() => {
              copyBtn.style.opacity = "1"; // Revert content after 2 seconds
            }, 300);
          });
        };

        // Append the copy button to the td element
        td.style.position = "relative";
        td.appendChild(copyBtn);

        // Additional styles and hover effects as previously described
        td.onmouseover = function () {
          copyBtn.style.opacity = "1";
        };
        td.onmouseout = function () {
          copyBtn.style.opacity = "0";
        };
      });
    });

    // ORDER HEADER && PURCHASER INFO COPY BUTTONS
    document
      .querySelectorAll(".v-card__text .row .columns")
      .forEach((column) => {
        const label = column.querySelector(".font-weight-bold");
        if (
          label &&
          (label.textContent.includes("Purchaser") ||
            label.textContent.includes("Store") ||
            label.textContent.includes("Order Date") ||
            label.textContent.includes("Trip Date") ||
            label.textContent.includes(`Email`) ||
            label.textContent.includes(`Billing Address`) ||
            label.textContent.includes(`Phone`))
        ) {
          // Create a copy button
          const copyButton = document.createElement("button");
          copyButton.innerHTML = '<i class="far fa-copy"></i>'; // Consider using an actual icon
          copyButton.classList.add("header-copy-button");

          copyButton.onclick = function () {
            // Find the text content to copy, considering intervening elements
            let textToCopy = "";
            let sibling = label.nextElementSibling;
            while (sibling) {
              if (sibling.tagName === "SMALL") {
                textToCopy = sibling.textContent.trim();
                break;
              }
              sibling = sibling.nextElementSibling;
            }

            if (textToCopy) {
              navigator.clipboard.writeText(textToCopy).then(() => {
                // Provide feedback that text was copied
                const originalIcon = copyButton.innerHTML;
                copyButton.style.opacity = "0";
                setTimeout(() => {
                  copyButton.style.opacity = "1"; // Revert content after 2 seconds
                }, 300);
              });
            }
          };

          // Append the copy button to the column element
          column.style.position = "relative"; // Ensure the column can correctly position the button
          column.appendChild(copyButton);

          column.onmouseover = function () {
            copyButton.style.opacity = "1";
          };
          column.onmouseout = function () {
            copyButton.style.opacity = "0";
          };
        }
      });

    // Similar wrapping for other parts of the script...
    // Ensure all other script parts are within this if block
  } else {
    // Extension is disabled; do not proceed further
    console.log("Extension is disabled.");
  }
});

// ============================================================================
// PRODUCT & TICKET TYPE ID COPY BUTTONS + POPUP HISTORY
// ----------------------------------------------------------------------------
// Product IDs live in the page URL (/admin/products/{id}/...). Ticket type IDs
// only exist inside the "Edit" links on the Ticket Types list page, paired with
// their title. We expose both as on-page copy buttons and stash everything we
// learn into chrome.storage.local so the popup can show a browsing history.
// ============================================================================
chrome.storage.sync.get("disabled", (data) => {
  if (data.disabled) return;
  try {
    initProductIdFeature();
  } catch (e) {
    console.error("Extranet Copy: ID feature failed", e);
  }
});

function initProductIdFeature() {
  const ctx = getProductContext();
  addIdHeaderChips(ctx);
  addInlineIdButtons();
  addCopyAllTicketTypesButton();
  recordProductHistory(ctx);
}

// On the Ticket Types list page, add a single button that copies every ticket
// type as "Name<tab>ID" lines (tab-separated so it pastes into a spreadsheet).
function addCopyAllTicketTypesButton() {
  const tts = collectTicketTypesOnPage();
  if (tts.length === 0) return;
  if (document.querySelector(".ext-copy-all")) return;

  // Prefer the "Ticket Types" card title; otherwise sit just above the table.
  let host = null;
  document.querySelectorAll("h2.v-card__title").forEach((h2) => {
    if (!host && /ticket types/i.test(h2.textContent.trim())) host = h2;
  });
  const firstEdit = document.querySelector(
    'a[href*="/ticket-types/"][href*="/edit"]',
  );
  const table = firstEdit ? firstEdit.closest("table") : null;
  if (!host && !table) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "ext-copy-all";
  btn.textContent = "Copy all ticket types";
  btn.title = "Copy every ticket type name + ID";
  btn.addEventListener("click", () => {
    const list = collectTicketTypesOnPage();
    const text = list
      .map((t) => (t.name || "Ticket type") + "\t" + t.id)
      .join("\n");
    copyWithFeedback(text, btn, "Copied " + list.length + " ticket types!");
  });

  if (host) {
    host.appendChild(btn);
  } else {
    table.parentNode.insertBefore(btn, table);
  }
}

// Derive product id / slug / name / ticket-type id from the URL + breadcrumbs.
function getProductContext() {
  const path = location.pathname;
  let productId = null;
  let slug = null;
  let name = null;
  let ticketTypeId = null;

  const pidUrl = path.match(/\/admin\/products\/(\d+)(?:\/|$)/);
  if (pidUrl) productId = pidUrl[1];

  const ttUrl = path.match(/\/ticket-types\/(\d+)(?:\/edit)?(?:\/|$)/);
  if (ttUrl) ticketTypeId = ttUrl[1];

  // Breadcrumbs are consistent across admin product pages and carry the product
  // name (slug link text) plus the numeric product id on ticket-type pages.
  document.querySelectorAll("a.breadcrumbs__breadcrumb").forEach((a) => {
    const href = (a.getAttribute("href") || "").replace(/[?#].*$/, "");
    const slugMatch = href.match(/\/admin\/products\/([a-z0-9][a-z0-9-]*)$/i);
    if (slugMatch && !/^\d+$/.test(slugMatch[1])) {
      slug = slugMatch[1];
      name = a.textContent.trim();
    }
    if (!productId) {
      const pm = href.match(/\/admin\/products\/(\d+)(?:\/|$)/);
      if (pm) productId = pm[1];
    }
  });

  if (!name) {
    const h1 = document.querySelector("h1.v-page-title");
    if (h1 && /^Product:/.test(h1.textContent.trim())) {
      name = h1.textContent.trim().replace(/^Product:\s*/, "");
    }
  }

  return { productId, slug, name, ticketTypeId, url: location.href };
}

// Copy text to the clipboard and give brief visual feedback on the element.
function copyWithFeedback(text, el, doneLabel) {
  if (el.dataset.busy === "1") return;
  navigator.clipboard.writeText(String(text)).then(() => {
    el.dataset.busy = "1";
    const original = el.innerHTML;
    el.innerHTML = doneLabel || "Copied!";
    el.classList.add("ext-copied");
    setTimeout(() => {
      el.innerHTML = original;
      el.classList.remove("ext-copied");
      el.dataset.busy = "0";
    }, 1200);
  });
}

// Add labeled "Product ID" / "Ticket Type ID" chips next to the page title.
function addIdHeaderChips(ctx) {
  if (!ctx.productId && !ctx.ticketTypeId) return;
  const title = document.querySelector("h1.v-page-title");
  if (!title || title.querySelector(".ext-id-chips")) return;

  const wrap = document.createElement("span");
  wrap.className = "ext-id-chips";
  if (ctx.productId) wrap.appendChild(makeChip("Product ID", ctx.productId));
  if (ctx.ticketTypeId)
    wrap.appendChild(makeChip("Ticket Type ID", ctx.ticketTypeId));
  title.appendChild(wrap);
}

function makeChip(label, value) {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "ext-id-chip";
  chip.innerHTML =
    '<span class="ext-id-chip__label"></span><span class="ext-id-chip__value"></span>';
  chip.querySelector(".ext-id-chip__label").textContent = label;
  chip.querySelector(".ext-id-chip__value").textContent = value;
  chip.title = "Copy " + label + " " + value;
  chip.addEventListener("click", () =>
    copyWithFeedback(value, chip, "Copied!"),
  );
  return chip;
}

// Drop a small copy button next to every product / ticket-type link on the page
// (e.g. the products index rows and the ticket-types list "Edit" links).
function addInlineIdButtons() {
  const onProductsIndex = /\/admin\/(?:stores\/\d+\/)?products\/?$/.test(
    location.pathname,
  );

  document.querySelectorAll('a[href*="/admin/products/"]').forEach((a) => {
    if (a.closest(".breadcrumbs")) return;

    const href = a.getAttribute("href") || "";
    let id = null;
    let label = null;
    let m = href.match(/\/ticket-types\/(\d+)\/edit/);
    if (m) {
      id = m[1];
      label = "ticket type";
    } else {
      m = href.match(/\/admin\/products\/(\d+)(?=\/|$)/);
      if (m) {
        id = m[1];
        label = "product";
      }
    }
    if (!id) return;

    // Only decorate links inside list rows or the products index, so we don't
    // clutter form footers ("Cancel"/"Setup") and one-off links.
    if (!(a.closest("td") || onProductsIndex)) return;

    // De-dupe per row so a product linked several times gets a single button.
    const row = a.closest("tr, li, .row") || a.parentElement;
    if (row && row.querySelector('.ext-id-copy[data-id="' + id + '"]')) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ext-id-copy";
    btn.dataset.id = id;
    btn.textContent = "📋";
    btn.title = "Copy " + label + " ID " + id;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      copyWithFeedback(id, btn, "✓");
    });
    a.insertAdjacentElement("afterend", btn);
  });
}

// Read every ticket type (id + title) from the rows on the Ticket Types page.
function collectTicketTypesOnPage() {
  const out = [];
  const seen = new Set();
  document.querySelectorAll('a[href*="/ticket-types/"]').forEach((a) => {
    const m = (a.getAttribute("href") || "").match(
      /\/ticket-types\/(\d+)\/edit/,
    );
    if (!m || seen.has(m[1])) return;
    seen.add(m[1]);
    let ttName = "";
    const tr = a.closest("tr");
    if (tr) {
      const tds = tr.querySelectorAll("td");
      if (tds[1])
        ttName = (tds[1].textContent || "").replace(/\s+/g, " ").trim();
    }
    out.push({ id: m[1], name: ttName });
  });
  return out;
}

// Persist what we learned about the current product into the popup history.
function recordProductHistory(ctx) {
  if (!ctx.productId) return;

  const ticketTypes = collectTicketTypesOnPage();
  if (ctx.ticketTypeId && !ticketTypes.some((t) => t.id === ctx.ticketTypeId)) {
    ticketTypes.push({ id: ctx.ticketTypeId, name: "" });
  }

  chrome.storage.local.get({ products: [] }, ({ products }) => {
    const i = products.findIndex((p) => p.productId === ctx.productId);
    const entry =
      i >= 0 ? products[i] : { productId: ctx.productId, ticketTypes: [] };
    if (ctx.name) entry.name = ctx.name;
    if (ctx.slug) entry.slug = ctx.slug;
    entry.lastSeen = Date.now();

    // Merge ticket types, preferring any non-empty title we already had.
    const byId = new Map(
      (entry.ticketTypes || []).map((t) => [t.id, { ...t }]),
    );
    ticketTypes.forEach((t) => {
      const existing = byId.get(t.id);
      if (existing) {
        if (t.name) existing.name = t.name;
      } else {
        byId.set(t.id, t);
      }
    });
    entry.ticketTypes = [...byId.values()].sort(
      (a, b) => Number(a.id) - Number(b.id),
    );

    // Move the just-visited product to the front, cap the history length.
    if (i >= 0) products.splice(i, 1);
    products.unshift(entry);
    chrome.storage.local.set({ products: products.slice(0, 40) });
  });
}
