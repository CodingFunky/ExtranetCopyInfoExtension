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

// // ADDS COPY BUTTON TO ALL TABLE ELEMENTS **TEMP**
document.querySelectorAll("tr").forEach((tr) => {
  tr.querySelectorAll("td").forEach((td) => {
    // Create a copy button
    const copyBtn = document.createElement("button");
    copyBtn.innerHTML = "📋"; // Use an actual icon or image in a real implementation
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
        textToCopy = td.textContent.trim();
      }
      // Remove the clipboard icon "📋" from the end of the text
      textToCopy = textToCopy.replace(/📋$/u, "");

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

// document.querySelectorAll("tr").forEach((tr) => {
//   tr.querySelectorAll("td").forEach((td, index) => {
//     // Create a copy button
//     const copyBtn = document.createElement("button");
//     copyBtn.innerHTML = "📋"; // Use an actual icon or image in a real implementation
//     copyBtn.classList.add("copy-button"); // Use class for styling

//     copyBtn.onclick = function () {
//       let textToCopy = "";

//       // Use a regular expression to split at "T" followed by any number
//       const parts = td.textContent.split(/T\d+/);
//       if (parts.length > 0) {
//         textToCopy = parts[0].trim(); // Take what comes before the "T" followed by numbers
//       }
//       // For the grand total cell, copy only the third dollar amount
//       else if (td.classList.contains("text-right")) {
//         // Identifies the cell by its class
//         const amounts = td.textContent.match(/\$\d+[\d,]*\.\d{2}/g); // Regex to find all dollar amounts
//         if (amounts && amounts.length >= 3) {
//           textToCopy = amounts[2]; // Assuming the grand total is always the third amount
//         }
//       } else {
//         // Default behavior for other cells
//         textToCopy = td.textContent.trim();
//       }

//       // Copy the determined text to clipboard
//       navigator.clipboard.writeText(textToCopy).then(() => {
//         // Provide feedback that text was copied
//         copyBtn.innerHTML = "✅"; // Indicate success
//         setTimeout(() => {
//           copyBtn.innerHTML = "📋"; // Revert content after 2 seconds
//         }, 2000);
//       });
//     };

//     // Style adjustments and appending the button
//     td.style.position = "relative";
//     td.appendChild(copyBtn);

//     // Hover effects
//     td.onmouseover = function () {
//       copyBtn.style.opacity = "1";
//     };
//     td.onmouseout = function () {
//       copyBtn.style.opacity = "0";
//     };
//   });
// });

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
