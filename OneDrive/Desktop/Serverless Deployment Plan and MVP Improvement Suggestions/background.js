// background.js - Playwright Tooltip System
// Manages context menu and extension state

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'toggle-tooltips',
        title: 'Enable Playwright Tooltips',
        contexts: ['page']
    });
    
    // Set initial state to enabled
    chrome.storage.sync.set({ tooltipsEnabled: true });
});

// Update context menu title based on state
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.tooltipsEnabled) {
        updateContextMenuTitle(changes.tooltipsEnabled.newValue);
    }
});

function updateContextMenuTitle(enabled) {
    chrome.contextMenus.update('toggle-tooltips', {
        title: enabled ? 'Disable Playwright Tooltips' : 'Enable Playwright Tooltips'
    });
}

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'toggle-tooltips') {
        chrome.storage.sync.get({ tooltipsEnabled: true }, (items) => {
            const newState = !items.tooltipsEnabled;
            chrome.storage.sync.set({ tooltipsEnabled: newState });
            updateContextMenuTitle(newState);
            
            // Notify content script to update state
            chrome.tabs.sendMessage(tab.id, {
                action: 'toggle-tooltips',
                enabled: newState
            });
            
            console.log(`Tooltips ${newState ? 'enabled' : 'disabled'}`);
        });
    }
});

// Initialize context menu title
chrome.storage.sync.get({ tooltipsEnabled: true }, (items) => {
    updateContextMenuTitle(items.tooltipsEnabled);
});

