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
  addCopyAllTicketTypesButton(ctx);
  addProductTicketTypeLoaders();
  recordProductHistory(ctx);
}

// On the Ticket Types list page, add a single button that copies the product
// (name + ID) followed by every ticket type as "Name<tab>ID" lines, so it stays
// readable and still pastes into a spreadsheet as two columns.
function addCopyAllTicketTypesButton(ctx) {
  const tts = collectTicketTypes(document);
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
  btn.title = "Copy the product and every ticket type name + ID";
  btn.addEventListener("click", () => {
    const list = collectTicketTypes(document);
    const rows = list.map((t) => (t.name || "Ticket type") + "\t" + t.id);

    let header = "";
    if (ctx && ctx.productId) {
      header = ctx.name
        ? ctx.name + " (Product ID: " + ctx.productId + ")"
        : "Product ID: " + ctx.productId;
    }

    const text = header ? header + "\n\n" + rows.join("\n") : rows.join("\n");
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

// Read every ticket type (id + title) from the rows of a Ticket Types page.
// Works on the live document or a document parsed from a background fetch.
function collectTicketTypes(root) {
  root = root || document;
  const out = [];
  const seen = new Set();
  root.querySelectorAll('a[href*="/ticket-types/"]').forEach((a) => {
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

// Upsert a product (and any ticket types we learned) into the popup history.
function upsertProductHistory({ productId, name, slug, ticketTypes }) {
  if (!productId) return;

  chrome.storage.local.get({ products: [] }, ({ products }) => {
    const i = products.findIndex((p) => p.productId === productId);
    const entry = i >= 0 ? products[i] : { productId, ticketTypes: [] };
    if (name) entry.name = name;
    if (slug) entry.slug = slug;
    entry.lastSeen = Date.now();

    // Merge ticket types, preferring any non-empty title we already had.
    const byId = new Map(
      (entry.ticketTypes || []).map((t) => [t.id, { ...t }]),
    );
    (ticketTypes || []).forEach((t) => {
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

    // Move the just-touched product to the front, cap the history length.
    if (i >= 0) products.splice(i, 1);
    products.unshift(entry);
    chrome.storage.local.set({ products: products.slice(0, 40) });
  });
}

// Persist what we learned about the current product into the popup history.
function recordProductHistory(ctx) {
  if (!ctx.productId) return;

  const ticketTypes = collectTicketTypes(document);
  if (ctx.ticketTypeId && !ticketTypes.some((t) => t.id === ctx.ticketTypeId)) {
    ticketTypes.push({ id: ctx.ticketTypeId, name: "" });
  }

  upsertProductHistory({
    productId: ctx.productId,
    name: ctx.name,
    slug: ctx.slug,
    ticketTypes,
  });
}

// Fetch a product's Ticket Types page in the background (using the current
// login session) and return its ticket types without navigating away.
async function fetchTicketTypes(productId) {
  const url =
    "https://www.liftopia.com/admin/products/" + productId + "/ticket-types";
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error("HTTP " + res.status);

  const doc = new DOMParser().parseFromString(await res.text(), "text/html");
  const tts = collectTicketTypes(doc);

  // Zero rows is only trustworthy if this really is the ticket-types page
  // (otherwise we were likely bounced to a login/error page).
  if (tts.length === 0) {
    const looksLikePage =
      doc.querySelector('a[href*="/ticket-types/new"]') ||
      /ticket types/i.test(doc.title || "");
    if (!looksLikePage) throw new Error("Unexpected response (logged out?)");
  }
  return tts;
}

// On the products index, add a per-row "Ticket types" button that loads the IDs
// inline (and into history) via a background fetch, no navigation required.
function addProductTicketTypeLoaders() {
  const onProductsIndex = /\/admin\/(?:stores\/\d+\/)?products\/?$/.test(
    location.pathname,
  );
  if (!onProductsIndex) return;

  document.querySelectorAll('a[href*="/admin/products/"]').forEach((a) => {
    if (a.closest(".breadcrumbs")) return;
    const m = (a.getAttribute("href") || "").match(
      /\/admin\/products\/(\d+)\/edit/,
    );
    if (!m) return;

    const cell = a.closest("td");
    if (!cell || cell.querySelector(".ext-tt-load")) return;

    const productId = m[1];
    const name = a.textContent.trim();

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ext-tt-load";
    btn.textContent = "Ticket types ▾";
    btn.title = "Load this product's ticket type IDs";

    const panel = document.createElement("div");
    panel.className = "ext-tt-panel";
    panel.style.display = "none";

    let loaded = false;
    let loading = false;
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const show = panel.style.display === "none";
      panel.style.display = show ? "block" : "none";
      btn.classList.toggle("ext-open", show);
      if (!show || loaded || loading) return;

      loading = true;
      panel.textContent = "";
      const msg = document.createElement("span");
      msg.className = "ext-tt-msg";
      msg.textContent = "Loading…";
      panel.appendChild(msg);

      try {
        const tts = await fetchTicketTypes(productId);
        loaded = true;
        renderTicketTypePanel(panel, productId, name, tts);
        upsertProductHistory({ productId, name, ticketTypes: tts });
      } catch (err) {
        panel.textContent = "";
        const err1 = document.createElement("span");
        err1.className = "ext-tt-msg ext-tt-error";
        err1.textContent = "Couldn't load. ";
        const link = document.createElement("a");
        link.href =
          "https://www.liftopia.com/admin/products/" +
          productId +
          "/ticket-types";
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = "Open page ↗";
        err1.appendChild(link);
        panel.appendChild(err1);
      } finally {
        loading = false;
      }
    });

    // Sit after the product-ID copy button if it's already there.
    const after =
      a.nextElementSibling &&
      a.nextElementSibling.classList.contains("ext-id-copy")
        ? a.nextElementSibling
        : a;
    after.insertAdjacentElement("afterend", btn);
    cell.appendChild(panel);
  });
}

// Render the fetched ticket types into a product's inline panel.
function renderTicketTypePanel(panel, productId, name, tts) {
  panel.textContent = "";

  if (tts.length === 0) {
    const m = document.createElement("div");
    m.className = "ext-tt-msg";
    m.textContent = "No ticket types on this product.";
    panel.appendChild(m);
    return;
  }

  const head = document.createElement("div");
  head.className = "ext-tt-head";
  const count = document.createElement("span");
  count.textContent = tts.length + " ticket types";
  head.appendChild(count);

  const copyAll = document.createElement("button");
  copyAll.type = "button";
  copyAll.className = "ext-tt-copyall";
  copyAll.textContent = "Copy all";
  copyAll.title = "Copy product + all ticket types";
  copyAll.addEventListener("click", () => {
    const header = name
      ? name + " (Product ID: " + productId + ")"
      : "Product ID: " + productId;
    const text =
      header +
      "\n\n" +
      tts.map((t) => (t.name || "Ticket type") + "\t" + t.id).join("\n");
    copyWithFeedback(text, copyAll, "Copied!");
  });
  head.appendChild(copyAll);
  panel.appendChild(head);

  tts.forEach((t) => {
    const row = document.createElement("div");
    row.className = "ext-tt-item";

    const lab = document.createElement("span");
    lab.className = "ext-tt-name";
    lab.textContent = t.name || "Ticket type";

    const val = document.createElement("span");
    val.className = "ext-tt-id";
    val.textContent = t.id;

    const cp = document.createElement("button");
    cp.type = "button";
    cp.className = "ext-id-copy";
    cp.textContent = "📋";
    cp.title = "Copy ticket type ID " + t.id;
    cp.addEventListener("click", () => copyWithFeedback(t.id, cp, "✓"));

    row.append(lab, val, cp);
    panel.appendChild(row);
  });
}
