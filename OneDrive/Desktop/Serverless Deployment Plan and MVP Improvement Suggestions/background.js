// background.js - Service Worker for Tooltip Companion

// Function to create/update context menu items
function createContextMenu() {
    // Remove existing items to avoid duplicates
    chrome.contextMenus.removeAll(() => {
        // Create context menu items
        chrome.contextMenus.create({
            id: 'toggle-tooltips',
            title: 'Enable/Disable Tooltips',
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
        
        chrome.contextMenus.create({
            id: 'open-chat',
            title: '💬 Open AI Chat Widget',
            contexts: ['all']
        });
        
        console.log('✅ Context menu created');
    });
}

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
    console.log('Tooltip Companion installed');
    createContextMenu();
});

// Create context menu when service worker starts (runs on every reload)
console.log('🚀 Tooltip Companion service worker starting...');
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
    else if (info.menuItemId === 'open-chat') {
        console.log('Opening chat widget...');
        
        // Send message to current tab to open chat
        if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
                action: 'open-chat'
            }).catch(() => {
                console.error('Failed to open chat - reload the page');
            });
        }
    }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Background received message:', request.action);
    
    if (request.action === 'chat') {
        console.log('💬 Forwarding chat message to backend...');
        console.log('🔹 Message:', request.message);
        console.log('🔹 URL:', request.url);
        console.log('🔹 API Key present:', request.openaiKey ? 'Yes' : 'No');
        
        fetch('http://localhost:3000/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: request.message,
                url: request.url,
                consoleLogs: request.consoleLogs,
                pageInfo: request.pageInfo,
                openaiKey: request.openaiKey
            })
        })
        .then(res => {
            console.log('🔹 Fetch response status:', res.status);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            return res.json();
        })
        .then(data => {
            console.log('✅ Chat response received:', data);
            sendResponse({ reply: data.reply });
        })
        .catch(error => {
            console.error('❌ Chat error:', error);
            console.error('Error stack:', error.stack);
            sendResponse({ reply: `Error: ${error.message}. Backend may be down or CORS issue.` });
        });
        
        return true; // Keep message channel open for async response
    }
    else if (request.action === 'transcribe') {
        console.log('🎤 Forwarding transcription to backend...');
        
        fetch('http://localhost:3000/transcribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                audio: request.audio,
                openaiKey: request.openaiKey
            })
        })
        .then(res => res.json())
        .then(data => {
            console.log('✅ Transcription received');
            sendResponse({ text: data.text });
        })
        .catch(error => {
            console.error('❌ Transcription error:', error);
            sendResponse({ text: null, error: 'Transcription service unavailable.' });
        });
        
        return true; // Keep message channel open for async response
    }
});

// Handle extension icon click - open options
chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage();
});

