document.addEventListener('DOMContentLoaded', function() {
    const disableBtn = document.getElementById('disableBtn');

    // Load the current state
    chrome.storage.sync.get('disabled', function(data) {
        // Update button text based on whether the extension is currently disabled
        disableBtn.textContent = data.disabled ? 'Enable' : 'Disable';
    });

    // Toggle extension enabled/disabled
    disableBtn.addEventListener('click', function() {
        chrome.storage.sync.get('disabled', function(data) {
            const newState = !data.disabled; // Toggle the state
            chrome.storage.sync.set({disabled: newState}, function() {
                // Update button text based on the new state
                disableBtn.textContent = newState ? 'Enable' : 'Disable';
                // Send a message to background service worker to enable/disable functionality
                chrome.runtime.sendMessage({action: "toggleDisable", value: newState});
            });
        });
    });
});
