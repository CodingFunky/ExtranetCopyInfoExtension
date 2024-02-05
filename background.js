chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "toggleDisable") {
      // Handle the enable/disable action
    }
  });
  