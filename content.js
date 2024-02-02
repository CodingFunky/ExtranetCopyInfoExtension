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
    button.classList.add("background-emerald-pale")
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
    copyBtn.innerHTML = "📋"; // Use an actual icon or image in a real implementation
    copyBtn.style.cursor = "pointer";
    copyBtn.style.marginLeft = "5px";
    copyBtn.style.border = "none";
    copyBtn.style.background = "none";
    copyBtn.style.opacity = "0"; // Button is invisible initially
    copyBtn.style.transition = "opacity 0.3s"; // Smooth transition for opacity change

    copyBtn.onclick = function () {
      // Initialize an empty string to accumulate text from text nodes
      let textToCopy = "";

      // Check if the td contains an <a> tag and copy its text content
      const link = td.querySelector("a");
      if (link) {
        textToCopy = link.textContent.trim();
      } else {
        // If no <a> tag, accumulate text from text nodes
        td.childNodes.forEach((node) => {
          if (node.nodeType === 3) { // Node type 3 is a text node
            textToCopy += node.textContent.trim();
          }
        });
      }


      // Copy accumulated text to clipboard
      navigator.clipboard.writeText(textToCopy).then(() => {
        // Provide feedback that text was copied
        const originalContent = copyBtn.innerHTML;
        copyBtn.innerHTML = "✅"; // Indicate success
        setTimeout(() => {
          copyBtn.innerHTML = originalContent; // Revert content after 2 seconds
        }, 2000);
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
document.querySelectorAll(".v-card__text .row .columns").forEach((column) => {
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
    copyButton.innerHTML = "📋"; // Consider using an actual icon
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
          copyButton.innerHTML = "✅"; // Indicate success
          setTimeout(() => {
            copyButton.innerHTML = originalIcon; // Revert content after 2 seconds
          }, 2000);
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





