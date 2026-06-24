document.addEventListener("DOMContentLoaded", function () {
  // ---- Enable / disable toggle ----
  const disableToggle = document.getElementById("disableToggle");

  chrome.storage.sync.get("disabled", function (data) {
    disableToggle.checked = !data.disabled;
  });

  disableToggle.addEventListener("change", function () {
    const isDisabled = !this.checked;
    // Content scripts read this from storage on page load (no live messaging).
    chrome.storage.sync.set({ disabled: isDisabled });
  });

  // ---- Product / ticket type history ----
  const listEl = document.getElementById("historyList");
  const emptyEl = document.getElementById("emptyState");
  const filterEl = document.getElementById("filter");
  const clearBtn = document.getElementById("clearHistory");
  const copyAllBtn = document.getElementById("copyAll");

  let products = [];

  // Same readable block format the on-page "copy all" buttons use.
  function formatProductBlock(p) {
    const header =
      (p.name ? p.name + " " : "") + "(Product ID: " + p.productId + ")";
    const tts = p.ticketTypes || [];
    if (tts.length === 0) return header + "\n  (no ticket types)";
    return (
      header +
      "\n" +
      tts.map((t) => "  " + (t.name || "Ticket type") + "\t" + t.id).join("\n")
    );
  }

  // Ask a logged-in Liftopia tab to fetch this product's ticket type IDs and
  // save them into history (the content script has the session cookies).
  function fetchTicketTypesForProduct(p, btn) {
    if (btn.dataset.busy === "1") return;
    btn.dataset.busy = "1";
    btn.textContent = "...";

    function fail(message) {
      btn.textContent = "Failed";
      btn.title = message || "Couldn't fetch ticket type IDs";
      setTimeout(function () {
        btn.textContent = "Get TTs";
        btn.title = "Get ticket type IDs for this product";
        btn.dataset.busy = "0";
      }, 1800);
    }

    chrome.tabs.query({ url: "https://www.liftopia.com/*" }, function (tabs) {
      if (!tabs || tabs.length === 0) {
        fail("Open a Liftopia tab, then try again");
        return;
      }
      const tab = tabs.find((t) => t.active) || tabs[0];
      chrome.tabs.sendMessage(
        tab.id,
        { action: "getTicketTypes", productId: p.productId, name: p.name },
        function (resp) {
          if (chrome.runtime.lastError || !resp || !resp.ok) {
            fail(
              (resp && resp.error) ||
                (chrome.runtime.lastError &&
                  chrome.runtime.lastError.message) ||
                "Couldn't fetch ticket type IDs",
            );
            return;
          }
          // Success: storage.onChanged re-renders (the button is recreated with
          // the new ticket-type rows, or stays if the product genuinely has 0).
          btn.textContent = resp.count > 0 ? "Done" : "0 TTs";
          btn.dataset.busy = "0";
        },
      );
    });
  }

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

  function idRow(extraClass, labelText, value, copyTitle, href) {
    const row = document.createElement("div");
    row.className = "id-row " + extraClass;

    let label;
    if (href) {
      label = document.createElement("a");
      label.className = "id-label id-link";
      label.href = href;
      label.target = "_blank";
      label.rel = "noopener";
      label.title = "Open ticket type edit page";
    } else {
      label = document.createElement("span");
      label.className = "id-label";
    }
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

    const nm = document.createElement("a");
    nm.className = "product-name";
    nm.textContent = p.name || "Product " + p.productId;
    nm.href =
      "https://www.liftopia.com/admin/products/" + p.productId + "/edit";
    nm.target = "_blank";
    nm.rel = "noopener";
    nm.title = "Open product page";
    head.appendChild(nm);

    // Copy just this product (name + ID + its ticket types).
    const copyProdBtn = document.createElement("button");
    copyProdBtn.type = "button";
    copyProdBtn.className = "copy-btn";
    copyProdBtn.textContent = "Copy all";
    copyProdBtn.title = "Copy this product and its ticket type IDs";
    copyProdBtn.addEventListener("click", function () {
      navigator.clipboard.writeText(formatProductBlock(p)).then(function () {
        copyProdBtn.textContent = "Copied!";
        copyProdBtn.classList.add("copied");
        setTimeout(function () {
          copyProdBtn.textContent = "Copy all";
          copyProdBtn.classList.remove("copied");
        }, 1000);
      });
    });
    head.appendChild(copyProdBtn);

    // No ticket types known yet -> offer to fetch them.
    if (!(p.ticketTypes && p.ticketTypes.length)) {
      const ttBtn = document.createElement("button");
      ttBtn.type = "button";
      ttBtn.className = "tt-fetch-btn";
      ttBtn.textContent = "Get TTs";
      ttBtn.title = "Get ticket type IDs for this product";
      ttBtn.addEventListener("click", function () {
        fetchTicketTypesForProduct(p, ttBtn);
      });
      head.appendChild(ttBtn);
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
      const href =
        t.url ||
        "https://www.liftopia.com/admin/products/" +
          p.productId +
          "/ticket-types/" +
          t.id +
          "/edit";
      card.appendChild(
        idRow(
          "tt-row",
          t.name || "Ticket type",
          t.id,
          "Copy ticket type ID " + t.id,
          href,
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

  copyAllBtn.addEventListener("click", function () {
    const q = (filterEl.value || "").toLowerCase().trim();
    const list = products.filter(function (p) {
      return matches(p, q);
    });
    if (list.length === 0) return;

    const text = list.map(formatProductBlock).join("\n\n");
    navigator.clipboard.writeText(text).then(function () {
      const original = copyAllBtn.textContent;
      copyAllBtn.textContent = "Copied!";
      setTimeout(function () {
        copyAllBtn.textContent = original;
      }, 1000);
    });
  });

  clearBtn.addEventListener("click", function () {
    chrome.storage.local.set({ products: [] });
  });
});
