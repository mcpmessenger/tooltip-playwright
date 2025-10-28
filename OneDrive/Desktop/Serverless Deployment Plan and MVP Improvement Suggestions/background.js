// background.js - Service Worker for Playwright Tooltip System

// Function to create/update context menu items
function createContextMenu() {
    // Remove existing items to avoid duplicates
    chrome.contextMenus.removeAll(() => {
        // Create context menu items
        chrome.contextMenus.create({
            id: 'toggle-tooltips',
            title: 'Enable/Disable Playwright Tooltips',
            contexts: ['all']
        });
        
        chrome.contextMenus.create({
            id: 'precrawl-links',
            title: 'Precrawl Links (Cache Screenshots)',
            contexts: ['all']
        });
        
        chrome.contextMenus.create({
            id: 'refresh-cache',
            title: 'Refresh Cache (Clear & Reload)',
            contexts: ['all']
        });
        
        console.log('✅ Context menu created');
    });
}

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
    console.log('Playwright Tooltip System installed');
    createContextMenu();
});

// Create context menu when service worker starts (runs on every reload)
console.log('🚀 Playwright Tooltip System service worker starting...');
createContextMenu();

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
    else if (info.menuItemId === 'precrawl-links') {
        console.log('Precrawling links...');
        
        // Send message to current tab to trigger precrawl
        if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
                action: 'precrawl-links'
            }).then(() => {
                console.log('✅ Precrawl triggered');
            }).catch(() => {
                console.error('❌ Failed to trigger precrawl - reload the page');
            });
        }
    }
    else if (info.menuItemId === 'refresh-cache') {
        console.log('Refreshing cache...');
        
        // Clear IndexedDB for all tabs
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'refresh-cache'
                }).catch(() => {
                    // Ignore errors for tabs that don't have content script
                });
            });
        });
    }
});

// Handle extension icon click - open options
chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage();
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request.action);
    
    if (request.action === 'chat') {
        console.log('Forwarding chat message to backend...');
        console.log('Message:', request.message);
        console.log('URL:', request.url);
        console.log('API Key present:', request.openaiKey ? 'Yes' : 'No');
        
        // Get backend URL from storage
        chrome.storage.sync.get({ backendUrl: 'http://localhost:3000' }, (items) => {
            const backendUrl = items.backendUrl.replace(/\/$/, '');
            
            // Forward chat request to backend
            fetch(`${backendUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: request.message,
                    currentUrl: request.url,
                    openaiKey: request.openaiKey
                })
            })
            .then(response => {
                console.log('Fetch response status:', response.status);
                return response.json();
            })
            .then(data => {
                console.log('✅ Chat response received from backend:', data);
                console.log('Sending response back to content script...');
                // ✅ FIX: Use data.response instead of data.reply
                sendResponse({ reply: data.response });
            })
            .catch(error => {
                console.error('❌ Chat fetch error:', error);
                sendResponse({ reply: `Error: ${error.message}. Check if backend is running on localhost:3000` });
            });
        });
        
        // Return true to indicate we will send a response asynchronously
        return true;
    }
});

