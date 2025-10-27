// background.js - Service Worker for Playwright Tooltip System

chrome.runtime.onInstalled.addListener(() => {
    console.log('Playwright Tooltip System installed');
    
    // Create context menu item
    chrome.contextMenus.create({
        id: 'toggle-tooltips',
        title: 'Enable/Disable Playwright Tooltips',
        contexts: ['all']
    });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'toggle-tooltips') {
        // Get current state
        chrome.storage.sync.get({ tooltipsEnabled: true }, (items) => {
            const newState = !items.tooltipsEnabled;
            
            // Save new state
            chrome.storage.sync.set({ tooltipsEnabled: newState }, () => {
                const status = newState ? 'ENABLED' : 'DISABLED';
                console.log(`Tooltips ${status}`);
                
                // Send message to content script in all tabs
                chrome.tabs.query({}, (tabs) => {
                    tabs.forEach(tab => {
                        chrome.tabs.sendMessage(tab.id, {
                            action: 'toggle-tooltips',
                            enabled: newState
                        }).catch(() => {
                            // Ignore errors for tabs that don't have content script
                        });
                    });
                });
            });
        });
    }
});

// Handle extension icon click - open options
chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage();
});

