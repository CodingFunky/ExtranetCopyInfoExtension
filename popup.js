document.addEventListener('DOMContentLoaded', function() {
    const disableToggle = document.getElementById('disableToggle');

    // Load the current state
    chrome.storage.sync.get('disabled', function(data) {
        disableToggle.checked = !data.disabled;
    });

    // Toggle extension enabled/disabled
    disableToggle.addEventListener('change', function() {
        const isDisabled = !this.checked;
        chrome.storage.sync.set({disabled: isDisabled}, function() {
            // Send a message to content scripts or background to enable/disable functionality
            chrome.runtime.sendMessage({action: "toggleDisable", value: isDisabled});
        });
    });
});
