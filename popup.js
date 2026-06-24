document.addEventListener("DOMContentLoaded", function () {
  // ---- Enable / disable toggle ----
  const disableToggle = document.getElementById("disableToggle");

  chrome.storage.sync.get("disabled", function (data) {
    disableToggle.checked = !data.disabled;
  });

  disableToggle.addEventListener("change", function () {
    const isDisabled = !this.checked;
    chrome.storage.sync.set({ disabled: isDisabled }, function () {
      chrome.runtime.sendMessage({
        action: "toggleDisable",
        value: isDisabled,
      });
    });
  });

  // ---- Product / ticket type history ----
  const listEl = document.getElementById("historyList");
  const emptyEl = document.getElementById("emptyState");
  const filterEl = document.getElementById("filter");
  const clearBtn = document.getElementById("clearHistory");

  let products = [];

  function copyButton(value, titleText) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "copy-btn";
    b.textContent = "Copy";
    b.title = titleText || "Copy " + value;
    b.addEventListener("click", function () {
      navigator.clipboard.writeText(String(value)).then(function () {
        const original = b.textContent;
        b.textContent = "Copied!";
        b.classList.add("copied");
        setTimeout(function () {
          b.textContent = original;
          b.classList.remove("copied");
        }, 1000);
      });
    });
    return b;
  }

  function idRow(extraClass, labelText, value, copyTitle) {
    const row = document.createElement("div");
    row.className = "id-row " + extraClass;

    const label = document.createElement("span");
    label.className = "id-label";
    label.textContent = labelText;

    const val = document.createElement("span");
    val.className = "id-value";
    val.textContent = value;

    row.append(label, val, copyButton(value, copyTitle));
    return row;
  }

  function renderProduct(p) {
    const card = document.createElement("div");
    card.className = "product";

    const head = document.createElement("div");
    head.className = "product-head";

    const nm = document.createElement("span");
    nm.className = "product-name";
    nm.textContent = p.name || "Product " + p.productId;
    head.appendChild(nm);

    if (p.slug) {
      const slug = document.createElement("span");
      slug.className = "product-slug";
      slug.textContent = p.slug;
      head.appendChild(slug);
    }
    card.appendChild(head);

    card.appendChild(
      idRow(
        "product-id-row",
        "Product ID",
        p.productId,
        "Copy product ID " + p.productId,
      ),
    );

    (p.ticketTypes || []).forEach(function (t) {
      card.appendChild(
        idRow(
          "tt-row",
          t.name || "Ticket type",
          t.id,
          "Copy ticket type ID " + t.id,
        ),
      );
    });

    return card;
  }

  function matches(p, q) {
    if (!q) return true;
    return (
      (p.name || "").toLowerCase().includes(q) ||
      (p.slug || "").toLowerCase().includes(q) ||
      (p.productId || "").includes(q) ||
      (p.ticketTypes || []).some(function (t) {
        return (
          (t.name || "").toLowerCase().includes(q) || (t.id || "").includes(q)
        );
      })
    );
  }

  function render() {
    const q = (filterEl.value || "").toLowerCase().trim();
    const filtered = products.filter(function (p) {
      return matches(p, q);
    });

    listEl.textContent = "";
    emptyEl.style.display = filtered.length ? "none" : "block";
    filtered.forEach(function (p) {
      listEl.appendChild(renderProduct(p));
    });
  }

  chrome.storage.local.get({ products: [] }, function (data) {
    products = data.products || [];
    render();
  });

  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area === "local" && changes.products) {
      products = changes.products.newValue || [];
      render();
    }
  });

  filterEl.addEventListener("input", render);

  clearBtn.addEventListener("click", function () {
    chrome.storage.local.set({ products: [] });
  });
});
