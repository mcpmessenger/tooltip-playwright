// content.js - Playwright Tooltip System
// Displays live screenshot previews when hovering over hyperlinks

(function() {
    'use strict';
    
        // Configuration
        const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
        const HOVER_DELAY = 800; // ms before showing tooltip (longer = more stable)
        const HIDE_DELAY = 500; // ms before hiding tooltip when mouse leaves (longer = more stable)
        const MIN_DISPLAY_TIME = 1000; // Minimum time to show tooltip once it appears
        const MAX_TOOLTIP_WIDTH = 400;
        const MAX_TOOLTIP_HEIGHT = 300;
    
    // Get backend URL and enabled state from storage
    chrome.storage.sync.get({ backendUrl: 'http://localhost:3000', tooltipsEnabled: true, openaiKey: '' }, (items) => {
        const BACKEND_SERVICE_URL = items.backendUrl.replace(/\/$/, ''); // Remove trailing slash
        const TOOLTIPS_ENABLED = items.tooltipsEnabled;
        const OPENAI_KEY = items.openaiKey;
        
        console.log('Extension loaded with settings:');
        console.log('  Backend URL:', BACKEND_SERVICE_URL);
        console.log('  Tooltips enabled:', TOOLTIPS_ENABLED);
        console.log('  OpenAI key set:', OPENAI_KEY ? 'YES' : 'NO');
        
        const status = TOOLTIPS_ENABLED ? '✅ ENABLED' : '❌ DISABLED';
        console.log(`${status} Playwright tooltips via Browser Extension!`);
    console.log(`   Backend Service URL: ${BACKEND_SERVICE_URL}`);
        console.log(`   Toggle: Right-click → ${TOOLTIPS_ENABLED ? 'Disable' : 'Enable'} Playwright Tooltips`);
        
        // Initialize the tooltip system
        initTooltipSystem(BACKEND_SERVICE_URL, TOOLTIPS_ENABLED);
        
        // Initialize the chat system
        initChatSystem(BACKEND_SERVICE_URL, OPENAI_KEY);
    });
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'toggle-tooltips') {
            const status = request.enabled ? '✅ ENABLED' : '❌ DISABLED';
            console.log(`Tooltips ${status}`);
            
            // Update the enabled state if initTooltipSystem is available
            if (window.tooltipsEnabled !== undefined) {
                window.tooltipsEnabled = request.enabled;
            }
            sendResponse({ success: true });
        }
        else if (request.action === 'precrawl-links') {
            console.log('🕷️ Precrawl triggered from context menu');
            
            // Trigger precrawl function if it exists
            if (typeof window.spiderPrecrawl === 'function') {
                window.spiderPrecrawl(20).then(result => {
                    console.log(`✅ Precrawl complete!`, result);
                    sendResponse({ success: true, result });
                }).catch(error => {
                    console.error('❌ Precrawl failed:', error);
                    sendResponse({ success: false, error: error.message });
                });
                return true; // Keep the channel open for async response
            } else {
                console.error('spiderPrecrawl function not found');
                sendResponse({ success: false, error: 'Function not available' });
            }
        }
        else if (request.action === 'refresh-cache') {
            console.log('🔄 Refreshing cache...');
            
            // Clear IndexedDB
            const deleteReq = indexedDB.deleteDatabase('playwright-tooltips');
            deleteReq.onsuccess = () => {
                console.log('✅ IndexedDB cleared');
                sendResponse({ success: true });
                
                // Reload page to reinitialize
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            };
            deleteReq.onerror = () => {
                console.warn('Failed to clear IndexedDB');
                sendResponse({ success: false, error: 'Failed to clear cache' });
            };
            return true; // Keep the channel open for async response
        }
        else {
            sendResponse({ success: false, error: 'Unknown action' });
        }
    });
    
    // Chat functionality
    function initChatSystem(BACKEND_SERVICE_URL, OPENAI_KEY) {
        // Create chat interface if it doesn't exist
        if (document.getElementById('tooltip-companion-chat')) {
            return; // Already exists
        }
        
        const chatContainer = document.createElement('div');
        chatContainer.id = 'tooltip-companion-chat';
        chatContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 350px;
            height: 500px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 999999;
            display: flex;
            flex-direction: column;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        // Chat header
        const chatHeader = document.createElement('div');
        chatHeader.style.cssText = `
            padding: 12px 16px;
            background: #f8f9fa;
            border-bottom: 1px solid #ddd;
            border-radius: 8px 8px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        chatHeader.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 20px; height: 20px; background: #007bff; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">🕷️</div>
                <span style="font-weight: 600; font-size: 14px;">Tooltip Companion</span>
            </div>
            <button id="chat-close" style="background: none; border: none; font-size: 18px; cursor: pointer; color: #666;">×</button>
        `;
        
        // Chat messages area
        const chatMessages = document.createElement('div');
        chatMessages.id = 'chat-messages';
        chatMessages.style.cssText = `
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
        `;
        
        // Chat input area
        const chatInput = document.createElement('div');
        chatInput.style.cssText = `
            padding: 12px 16px;
            border-top: 1px solid #ddd;
            display: flex;
            gap: 8px;
        `;
        chatInput.innerHTML = `
            <input type="text" id="chat-input" placeholder="Type a message..." style="flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 20px; outline: none; font-size: 14px;">
            <button id="chat-send" style="background: #007bff; color: white; border: none; border-radius: 50%; width: 36px; height: 36px; cursor: pointer; display: flex; align-items: center; justify-content: center;">✈</button>
        `;
        
        chatContainer.appendChild(chatHeader);
        chatContainer.appendChild(chatMessages);
        chatContainer.appendChild(chatInput);
        document.body.appendChild(chatContainer);
        
        // Add welcome message based on API key status
        if (OPENAI_KEY && OPENAI_KEY.trim()) {
            addChatMessage('🎉 UPDATED! Your extension has been reloaded successfully! Ready to chat? ✨', 'bot');
        } else {
            addChatMessage('OpenAI API key not configured! To enable chat: 1. Click the extension icon → Options 2. Enter your OpenAI API key 3. Click "Save Settings" 4. Try chatting again! Get your key at: https://platform.openai.com/api-keys', 'bot');
        }
        
        // Event listeners
        document.getElementById('chat-close').addEventListener('click', () => {
            chatContainer.style.display = 'none';
        });
        
        document.getElementById('chat-send').addEventListener('click', sendChatMessage);
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
        
        function addChatMessage(message, sender) {
            const messageDiv = document.createElement('div');
            messageDiv.style.cssText = `
                padding: 8px 12px;
                border-radius: 12px;
                max-width: 80%;
                font-size: 14px;
                line-height: 1.4;
                ${sender === 'user' ? 
                    'background: #007bff; color: white; margin-left: auto;' : 
                    'background: #f1f3f4; color: #333; margin-right: auto;'
                }
            `;
            messageDiv.textContent = message;
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        async function sendChatMessage() {
            const input = document.getElementById('chat-input');
            const message = input.value.trim();
            
            if (!message) return;
            
            // Check if API key is configured
            if (!OPENAI_KEY || !OPENAI_KEY.trim()) {
                addChatMessage('OpenAI API key not configured! To enable chat: 1. Click the extension icon → Options 2. Enter your OpenAI API key 3. Click "Save Settings" 4. Try chatting again! Get your key at: https://platform.openai.com/api-keys', 'bot');
                return;
            }
            
            // Add user message
            addChatMessage(message, 'user');
            input.value = '';
            
            try {
                console.log('Sending chat request to:', `${BACKEND_SERVICE_URL}/chat`);
                console.log('Request payload:', { message, currentUrl: window.location.href, openaiKey: OPENAI_KEY ? '***' : 'NOT_SET' });
                
                const response = await fetch(`${BACKEND_SERVICE_URL}/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        message: message,
                        currentUrl: window.location.href,
                        openaiKey: OPENAI_KEY
                    })
                });
                
                console.log('Response status:', response.status);
                console.log('Response headers:', response.headers);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Response error text:', errorText);
                    throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
                }
                
                const responseText = await response.text();
                console.log('Raw response text:', responseText);
                
                let data;
                try {
                    data = JSON.parse(responseText);
                    console.log('Parsed response:', data);
                } catch (parseError) {
                    console.error('JSON parse error:', parseError);
                    console.error('Raw response that failed to parse:', responseText);
                    throw new Error('Invalid JSON response from backend');
                }
                
                console.log('Chat response received:', data);
                
                if (data.response) {
                    addChatMessage(data.response, 'bot');
                } else {
                    addChatMessage('I received your message but couldn\'t generate a proper response.', 'bot');
                }
                
            } catch (error) {
                console.error('Chat error:', error);
                addChatMessage(`Error: ${error.message}. Check if backend is running on localhost:3000`, 'bot');
            }
        }
    }
        // State management
        window.tooltipsEnabled = tooltipsEnabled;
        const cache = new Map();
        const activeTooltip = { 
            element: null, 
            timeout: null, 
            hideTimeout: null,
            currentUrl: null,
            displayStartTime: null,
            isVisible: false
        };
        let tooltipDiv = null;
        
        // IndexedDB for persistent storage
        let db = null;
        const DB_NAME = 'playwright-tooltips';
        const DB_VERSION = 1;
        const STORE_NAME = 'screenshots';
        
        // Initialize IndexedDB
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => console.warn('IndexedDB failed to open');
        request.onsuccess = () => {
            db = request.result;
            console.log('✅ IndexedDB initialized for persistent caching');
        };
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'url' });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
        
        // Create tooltip element
        function createTooltipElement() {
            if (tooltipDiv) return tooltipDiv;
            
            tooltipDiv = document.createElement('div');
            tooltipDiv.id = 'playwright-tooltip';
            tooltipDiv.style.cssText = `
                position: fixed;
                display: none;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                padding: 0;
                z-index: 999999;
                pointer-events: auto;
                max-width: ${MAX_TOOLTIP_WIDTH}px;
                max-height: ${MAX_TOOLTIP_HEIGHT}px;
                overflow: hidden;
                opacity: 0;
                transition: opacity 0.2s ease-in-out;
            `;
            
            // Keep tooltip visible when hovering over it
            tooltipDiv.addEventListener('mouseenter', () => {
                if (activeTooltip.hideTimeout) {
                    clearTimeout(activeTooltip.hideTimeout);
                }
            });
            
            tooltipDiv.addEventListener('mouseleave', () => {
                if (activeTooltip.hideTimeout) {
                    clearTimeout(activeTooltip.hideTimeout);
                }
                hideTooltip();
            });
            document.body.appendChild(tooltipDiv);
            return tooltipDiv;
        }
        
        // Show tooltip with screenshot
        function showTooltip(x, y, screenshotUrl) {
            if (!tooltipDiv) {
                tooltipDiv = createTooltipElement();
            }
            
            // Update tooltip content with error handling
            if (screenshotUrl) {
                // Try to get analysis for this URL
                fetch(`${BACKEND_SERVICE_URL}/analyze/${encodeURIComponent(url)}`)
                    .then(response => response.ok ? response.json() : null)
                    .then(data => {
                        if (data && data.analysis) {
                            const analysis = data.analysis;
                            tooltipDiv.innerHTML = `
                                <div style="position: relative;">
                                    <img src="${screenshotUrl}" 
                                        style="display: block; width: 100%; height: auto; max-height: ${MAX_TOOLTIP_HEIGHT - 60}px; object-fit: cover;" 
                                        alt="Link preview" 
                                        onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=&quot;padding: 20px; text-align: center; color: #d32f2f;&quot;>⚠️ Failed to load preview</div>'">
                                    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.8); color: white; padding: 8px; font-size: 11px;">
                                        <div style="font-weight: bold; margin-bottom: 4px;">🧠 ${analysis.pageType.toUpperCase()}</div>
                                        ${analysis.keyTopics.length > 0 ? `<div>📋 ${analysis.keyTopics.join(', ')}</div>` : ''}
                                        ${analysis.suggestedActions.length > 0 ? `<div style="margin-top: 4px; font-style: italic;">💡 ${analysis.suggestedActions[0]}</div>` : ''}
                                    </div>
                                </div>
                            `;
                        } else {
                            tooltipDiv.innerHTML = `<img src="${screenshotUrl}" 
                                style="display: block; width: 100%; height: auto; max-height: ${MAX_TOOLTIP_HEIGHT}px; object-fit: cover;" 
                                alt="Link preview" 
                                onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=&quot;padding: 20px; text-align: center; color: #d32f2f;&quot;>⚠️ Failed to load preview</div>'">`;
                        }
                    })
                    .catch(() => {
                        tooltipDiv.innerHTML = `<img src="${screenshotUrl}" 
                            style="display: block; width: 100%; height: auto; max-height: ${MAX_TOOLTIP_HEIGHT}px; object-fit: cover;" 
                            alt="Link preview" 
                            onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=&quot;padding: 20px; text-align: center; color: #d32f2f;&quot;>⚠️ Failed to load preview</div>'">`;
                    });
            } else {
                tooltipDiv.innerHTML = `<div style="padding: 20px; text-align: center; color: #666;">🔍 Analyzing page...</div>`;
            }
            
            // Position tooltip
            tooltipDiv.style.display = 'block';
            
            // Get tooltip dimensions after display to properly position
            requestAnimationFrame(() => {
                const rect = tooltipDiv.getBoundingClientRect();
                let left = x + 10;
                let top = y + 10;
                
                // Adjust if would overflow viewport
                if (left + rect.width > window.innerWidth) {
                    left = x - rect.width - 10;
                }
                if (left < 0) left = 10;
                
                if (top + rect.height > window.innerHeight) {
                    top = y - rect.height - 10;
                }
                if (top < 0) top = 10;
                
                tooltipDiv.style.left = left + 'px';
                tooltipDiv.style.top = top + 'px';
                
                // Fade in
                setTimeout(() => {
                    tooltipDiv.style.opacity = '1';
                }, 10);
            });
            
            // Mark as visible
            activeTooltip.isVisible = true;
            activeTooltip.displayStartTime = Date.now();
        }
        
        // Hide tooltip
        function hideTooltip() {
            // Check minimum display time
            if (activeTooltip.isVisible && activeTooltip.displayStartTime) {
                const timeVisible = Date.now() - activeTooltip.displayStartTime;
                if (timeVisible < MIN_DISPLAY_TIME) {
                    // Too soon to hide, reschedule
                    setTimeout(() => hideTooltip(), MIN_DISPLAY_TIME - timeVisible + 100);
                    return;
                }
            }
            
            if (tooltipDiv) {
                tooltipDiv.style.opacity = '0';
                setTimeout(() => {
                    if (tooltipDiv) {
                        tooltipDiv.style.display = 'none';
                        tooltipDiv.innerHTML = ''; // Clear content
                    }
                }, 200);
            }
            
            // Reset state
            activeTooltip.isVisible = false;
            activeTooltip.displayStartTime = null;
        }
        
        // Check cache validity
        function isCacheValid(cacheEntry) {
            return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_TTL;
        }
        
        // Fetch screenshot from backend with timeout and retry
        async function fetchScreenshot(url) {
            const MAX_RETRIES = 2;
            const TIMEOUT_MS = 8000; // 8 second timeout
            
            for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
                try {
                    console.log(`📸 Fetching screenshot for: ${url} (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);
                    
                    // Create abort controller for timeout
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
                    
                    const response = await fetch(`${BACKEND_SERVICE_URL}/capture`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url }),
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log(`✅ Received response, converting to blob...`);
                
                // Handle different response formats and convert to blob
                let base64Data;
                if (typeof data === 'string') {
                    base64Data = data;
                } else if (data.screenshot) {
                    base64Data = data.screenshot;
                } else if (data.url) {
                    base64Data = data.url;
                } else if (data.body && data.body.screenshot) {
                    base64Data = data.body.screenshot;
                } else {
                    throw new Error('Invalid response format');
                }
                
                // Extract base64 data from data URL if present
                let base64String;
                if (base64Data.startsWith('data:image/')) {
                    // Extract just the base64 part after the comma
                    const commaIndex = base64Data.indexOf(',');
                    base64String = base64Data.substring(commaIndex + 1);
                } else {
                    base64String = base64Data;
                }
                
                // Convert base64 to blob
                const binaryString = atob(base64String);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: 'image/png' });
                const blobUrl = URL.createObjectURL(blob);
                console.log(`✅ Blob URL created: ${blobUrl.substring(0, 50)}...`);
                
                // Clean up old blob URLs to prevent memory leaks
                const cacheEntry = cache.get(url);
                if (cacheEntry && cacheEntry.screenshotUrl && cacheEntry.screenshotUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(cacheEntry.screenshotUrl);
                }
                
                // Cache the blob URL
                cache.set(url, {
                    screenshotUrl: blobUrl,
                    timestamp: Date.now()
                });
                
                // Also save to IndexedDB for persistence (save base64 data, not blob URL)
                await saveToIndexedDB(url, base64Data);
                
                    console.log(`✅ Screenshot cached successfully`);
                    return blobUrl;
                    
                } catch (error) {
                    clearTimeout(timeoutId);
                    console.error(`Attempt ${attempt + 1} failed:`, error.message);
                    
                    // If this was the last attempt, throw the error
                    if (attempt === MAX_RETRIES) {
                        console.error(`❌ All ${MAX_RETRIES + 1} attempts failed for ${url}`);
                        throw error;
                    }
                    
                    // Wait a bit before retrying (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
                }
            }
        }
        
        // Load screenshot from IndexedDB
        async function loadFromIndexedDB(url) {
            if (!db) return null;
            
            try {
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(url);
                
                return new Promise((resolve, reject) => {
                    request.onsuccess = () => {
                        if (request.result && isCacheValid(request.result)) {
                            console.log(`📦 IndexedDB hit: ${url}`);
                            
                            // Convert base64 to blob if needed
                            let blobUrl = request.result.screenshotUrl;
                            
                            // If it's base64 data, convert to blob
                            if (typeof request.result.screenshotUrl === 'string' && 
                                !request.result.screenshotUrl.startsWith('blob:') && 
                                !request.result.screenshotUrl.startsWith('http')) {
                                try {
                                    const binaryString = atob(request.result.screenshotUrl);
                                    const bytes = new Uint8Array(binaryString.length);
                                    for (let i = 0; i < binaryString.length; i++) {
                                        bytes[i] = binaryString.charCodeAt(i);
                                    }
                                    const blob = new Blob([bytes], { type: 'image/png' });
                                    blobUrl = URL.createObjectURL(blob);
                                } catch (e) {
                                    console.warn('Failed to convert base64 to blob:', e);
                                    resolve(null);
                                    return;
                                }
                            }
                            
                            // Also update memory cache
                            cache.set(url, {
                                screenshotUrl: blobUrl,
                                timestamp: request.result.timestamp
                            });
                            
                            resolve(blobUrl);
                        } else {
                            resolve(null);
                        }
                    };
                    request.onerror = () => reject(request.error);
                });
            } catch (error) {
                console.warn('IndexedDB read error:', error);
                return null;
            }
        }
        
        // Save screenshot to IndexedDB
        async function saveToIndexedDB(url, dataToSave) {
            if (!db) return;
            
            try {
                const data = {
                    url: url,
                    screenshotUrl: dataToSave, // Can be base64 data or blob URL
                    timestamp: Date.now()
                };
                
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                await store.put(data);
                console.log(`💾 Saved to IndexedDB: ${url}`);
            } catch (error) {
                console.warn('IndexedDB write error:', error);
            }
        }
        
        // Get screenshot (from IndexedDB, cache, or fetch)
        async function getScreenshot(url) {
            // Check memory cache first
            const cacheEntry = cache.get(url);
            if (isCacheValid(cacheEntry)) {
                return cacheEntry.screenshotUrl;
            }
            
            // Try IndexedDB
            const indexedDBScreenshot = await loadFromIndexedDB(url);
            if (indexedDBScreenshot) {
                return indexedDBScreenshot;
            }
            
            // Fetch from backend
            const screenshotUrl = await fetchScreenshot(url);
            
            // Save to IndexedDB for persistence
            await saveToIndexedDB(url, screenshotUrl);
            
            return screenshotUrl;
        }
        
        // Handle link hover
        function handleLinkHover(event) {
            // Check if tooltips are enabled
            if (!window.tooltipsEnabled) {
                return;
            }
            
            const element = event.currentTarget;
            const url = getElementUrl(element);
            
            if (!url || url === window.location.href) {
                return; // Don't show preview for current page
            }
            
            // Skip mailto: links (email addresses)
            if (url.startsWith('mailto:')) {
                return;
            }
            
            // Skip javascript: and data: links
            if (url.startsWith('javascript:') || url.startsWith('data:')) {
                return;
            }
            
            // Skip anchors to same page
            if (url.startsWith('#') || (url.startsWith('/') && !url.includes('http'))) {
                return;
            }
            
            // Skip LinkedIn auth/session URLs (likely to return 500)
            if (url.includes('linkedin.com/me/') || 
                url.includes('/profile-views/') ||
                url.includes('tscp?destination') ||
                url.includes('/authenticate') ||
                url.includes('/login')) {
                console.log(`⏭️ Skipping auth/session URL: ${url}`);
                return;
            }
            
            // Cancel any pending hide operations
            if (activeTooltip.hideTimeout) {
                clearTimeout(activeTooltip.hideTimeout);
                activeTooltip.hideTimeout = null;
                // If tooltip is already showing and mouse is still over element, just update position
                if (activeTooltip.isVisible && activeTooltip.currentUrl === url && tooltipDiv) {
                    // Don't hide, just let it stay
                    return;
                }
            }
            
            // If hovering over the same element and tooltip is showing, don't re-trigger
            if (activeTooltip.currentUrl === url && activeTooltip.element === element && activeTooltip.isVisible) {
                return;
            }
            
            // Clear previous timeout
            if (activeTooltip.timeout) {
                clearTimeout(activeTooltip.timeout);
                activeTooltip.timeout = null;
            }
            
            // Set active element
            activeTooltip.element = element;
            activeTooltip.currentUrl = url;
            
            // Check cache first
            const cacheEntry = cache.get(url);
            if (cacheEntry && isCacheValid(cacheEntry)) {
                // Cached - show after short delay
                activeTooltip.timeout = setTimeout(() => {
                    if (activeTooltip.element === element && activeTooltip.currentUrl === url && !activeTooltip.isVisible) {
                        showTooltip(event.clientX, event.clientY, cacheEntry.screenshotUrl);
                    }
                }, HOVER_DELAY);
                return;
            }
            
            // Not cached - fetch with delay
            activeTooltip.timeout = setTimeout(() => {
                // Only proceed if still on same element and not already visible
                if (activeTooltip.element === element && activeTooltip.currentUrl === url && !activeTooltip.isVisible) {
                    // Show loading
                    showTooltip(event.clientX, event.clientY, null);
                    
                    // Set a timeout to hide loading if it takes too long
                    const loadingTimeout = setTimeout(() => {
                        if (tooltipDiv && activeTooltip.isVisible) {
                            console.warn('Screenshot load timeout, hiding tooltip');
                            hideTooltip();
                        }
                    }, 10000); // 10 second timeout
                    
                    // Fetch screenshot
                    getScreenshot(url)
                        .then(screenshotUrl => {
                            clearTimeout(loadingTimeout);
                            // Check if still valid before showing
                            if (activeTooltip.element === element && activeTooltip.currentUrl === url) {
                                // Replace loading with screenshot
                                if (tooltipDiv) {
                                    tooltipDiv.innerHTML = `<img src="${screenshotUrl}" 
                                        style="display: block; width: 100%; height: auto; max-height: ${MAX_TOOLTIP_HEIGHT}px; object-fit: cover;" 
                                        alt="Link preview" 
                                        onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=&quot;padding: 20px; text-align: center; color: #d32f2f;&quot;>⚠️ Failed to load preview</div>'">`;
                                }
                            }
                        })
                        .catch(error => {
                            clearTimeout(loadingTimeout);
                            console.warn('Failed to load screenshot:', error);
                            if (activeTooltip.element === element && activeTooltip.currentUrl === url && tooltipDiv) {
                                tooltipDiv.innerHTML = `<div style="padding: 15px; text-align: center; color: #d32f2f; font-size: 12px;">⚠️ Failed to load</div>`;
                                // Auto-hide error after 2 seconds
                                setTimeout(() => hideTooltip(), 2000);
                            }
                        });
                }
            }, HOVER_DELAY);
        }
        
        // Handle mouse leave
        function handleLinkLeave() {
            // Don't hide immediately, wait a bit to prevent flickering
            activeTooltip.hideTimeout = setTimeout(() => {
                // Clear the active state
                activeTooltip.element = null;
                activeTooltip.currentUrl = null;
                
                // Clear any pending show timeout
                if (activeTooltip.timeout) {
                    clearTimeout(activeTooltip.timeout);
                    activeTooltip.timeout = null;
                }
                
                // Hide the tooltip
                hideTooltip();
            }, HIDE_DELAY);
        }
        
        // Use event delegation for better Gmail compatibility
        function attachToLinks() {
            // Remove old direct listeners if any
            document.removeEventListener('mouseenter', delegateHandleEnter, true);
            document.removeEventListener('mouseleave', delegateHandleLeave, true);
            
            // Add event delegation listeners
            document.addEventListener('mouseenter', delegateHandleEnter, true);
            document.addEventListener('mouseleave', delegateHandleLeave, true);
        }
        
        // Delegated mouseenter handler
        function delegateHandleEnter(event) {
            // Safely get the target element
            const target = event.target;
            if (!target || typeof target.closest !== 'function') {
                return;
            }
            
            // Check for clickable element
            const clickable = target.closest('a[href], button, [role="button"], [role="link"], [onclick], [data-href], [data-clickable], [data-url], [data-to], [data-path]');
            if (clickable && isClickableElement(clickable) && getElementUrl(clickable)) {
                handleLinkHover({ 
                    currentTarget: clickable, 
                    clientX: event.clientX, 
                    clientY: event.clientY 
                });
            }
        }
        
        // Delegated mouseleave handler
        function delegateHandleLeave(event) {
            // Safely get the target element
            const target = event.target;
            if (!target || typeof target.closest !== 'function') {
                return;
            }
            
            // Check for clickable element
            const clickable = target.closest('a[href], button, [role="button"], [role="link"], [onclick], [data-href], [data-clickable], [data-url], [data-to], [data-path]');
            if (clickable && isClickableElement(clickable)) {
                handleLinkLeave.call(clickable);
            }
        }
        
        // Detect if element is clickable
        function isClickableElement(element) {
            if (!element) return false;
            
            // Ignore hidden elements
            const style = window.getComputedStyle(element);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
                return false;
            }
            
            // Check for links
            if (element.tagName === 'A' && element.href) return true;
            
            // Check for buttons - only if they have navigation URLs
            if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
                const url = getElementUrl(element);
                if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                    return true;
                }
                // Skip buttons without navigation URLs to avoid false positives
                return false;
            }
            
            // Check for onclick handlers that contain URL navigation
            const onclick = element.onclick || element.getAttribute('onclick');
            if (onclick) {
                const onclickStr = onclick.toString();
                if (onclickStr.match(/["'](https?:\/\/[^"']+)["']/)) return true;
            }
            
            // Check for elements with role="link" AND valid URL
            if (element.getAttribute('role') === 'link') {
                const url = getElementUrl(element);
                if (url && (url.startsWith('http://') || url.startsWith('https://'))) return true;
            }
            
            // Check for anchor tags (even without href)
            if (element.tagName === 'A') return true;
            
            // Check for clickable divs/spans with navigation URLs
            if (element.dataset.href || element.dataset.url || element.dataset.to || element.dataset.path || element.dataset.link) {
                const url = getElementUrl(element);
                if (url && (url.startsWith('http://') || url.startsWith('https://')) && !url.startsWith('javascript:')) {
                    return true;
                }
            }
            
            
            // Check if element is inside a link
            const parentLink = element.closest('a[href]');
            if (parentLink && parentLink.href) return true;
            
            // Check for common framework test attributes with valid URLs
            if (element.dataset.testid || element.dataset.cy || element.dataset.testId) {
                const url = getElementUrl(element);
                if (url && (url.startsWith('http://') || url.startsWith('https://'))) return true;
            }
            
            return false;
        }
        
        // Get URL from any clickable element
        function getElementUrl(element) {
            // Direct href attribute
            if (element.href) return element.href;
            
            // Data attributes (many frameworks use these)
            if (element.dataset.href) return element.dataset.href;
            if (element.dataset.url) return element.dataset.url;
            if (element.dataset.link) return element.dataset.link;
            if (element.dataset.to) return element.dataset.to; // React Router
            if (element.dataset.path) return element.dataset.path;
            
            // Check for onclick attribute that might contain URL
            const onclick = element.getAttribute('onclick') || element.onclick?.toString();
            if (onclick) {
                const urlMatch = onclick.match(/["'](https?:\/\/[^"']+)["']/);
                if (urlMatch) return urlMatch[1];
            }
            
            // Check for aria-label or title that might contain a URL
            const ariaLabel = element.getAttribute('aria-label');
            if (ariaLabel) {
                const urlMatch = ariaLabel.match(/https?:\/\/[^\s]+/);
                if (urlMatch) return urlMatch[0];
            }
            
            // Check parent link element (handles buttons inside links)
            const link = element.closest('a[href]');
            if (link && link.href) return link.href;
            
            // Check for next siblings that are links (common pattern: button + hidden link)
            let sibling = element.nextElementSibling;
            if (sibling && sibling.tagName === 'A' && sibling.href) {
                return sibling.href;
            }
            
            // Check for form submission that might redirect
            if (element.type === 'submit' && element.form && element.form.action) {
                return element.form.action;
            }
            
            return null;
        }
        
        // Also attach directly for performance on existing clickable elements
        function attachDirectListeners() {
            // Get all potential clickable elements (broader selector)
            const clickables = document.querySelectorAll(
                'a[href], button, [role="button"], [role="link"], [onclick], ' +
                '[data-href], [data-clickable], [data-url], [data-to], [data-path]'
            );
            
            clickables.forEach(element => {
                // Skip if already has listeners
                if (element.dataset.tooltipAttached === 'true') {
                    return;
                }
                
                // Only attach if actually clickable and has a URL
                if (isClickableElement(element) && getElementUrl(element)) {
                    element.dataset.tooltipAttached = 'true';
                    element.addEventListener('mouseenter', handleLinkHover, { capture: true });
                    element.addEventListener('mouseleave', handleLinkLeave, { capture: true });
                }
            });
        }
        
        // Observe DOM changes for dynamically added links
        function observeDOM() {
            const observer = new MutationObserver(() => {
                // Re-attach direct listeners for new links
                attachDirectListeners();
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            // Also handle iframes (common in Gmail)
            document.querySelectorAll('iframe').forEach(iframe => {
                try {
                    iframe.addEventListener('load', () => {
                        try {
                            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                            if (iframeDoc) {
                                const iframeLinks = iframeDoc.querySelectorAll('a[href]');
                                iframeLinks.forEach(link => {
                                    if (!link.dataset.tooltipAttached) {
                                        link.dataset.tooltipAttached = 'true';
                                        link.addEventListener('mouseenter', (e) => {
                                            handleLinkHover({
                                                currentTarget: link,
                                                clientX: e.clientX + iframe.offsetLeft,
                                                clientY: e.clientY + iframe.offsetTop
                                            });
                                        }, { capture: true });
                                    }
                                });
                            }
                        } catch (e) {
                            // Cross-origin iframe, skip
                        }
                    });
                } catch (e) {
                    // Can't access iframe
                }
            });
        }
        
        // Batch precrawl function - works with ALL clickable elements
        window.spiderPrecrawl = async function(maxItems = 50) {
            // Get all potential clickable elements (broader selector)
            const allClickables = Array.from(document.querySelectorAll(
                'a[href], button, [role="button"], [role="link"], [onclick], ' +
                '[data-href], [data-clickable], [data-url], [data-to], [data-path], ' +
                '[cursor="pointer"], .btn, .button, .clickable, .link, .card, .tile'
            ));
            
            // Filter to only actually clickable elements
            const validClickables = allClickables.filter(el => {
                // Must be visible
                const style = window.getComputedStyle(el);
                if (style.display === 'none' || style.visibility === 'hidden') return false;
                
                // Must be clickable
                if (!isClickableElement(el)) return false;
                
                // Must have a URL
                const url = getElementUrl(el);
                if (!url) return false;
                
                return true;
            });
            
            // Extract URLs and filter
            const urls = validClickables
                .map(el => getElementUrl(el))
                .filter(url => url && 
                    !url.includes(window.location.hostname) &&  // Skip same-page links
                    !url.startsWith('mailto:') &&
                    !url.startsWith('javascript:') &&
                    !url.startsWith('data:') &&
                    !url.startsWith('#') &&
                    (url.startsWith('http://') || url.startsWith('https://')) // Only HTTP/HTTPS
                )
                .filter((url, index, self) => self.indexOf(url) === index) // Remove duplicates
                .slice(0, maxItems);
            
            console.log(`🕷️ Pre-caching ${urls.length} clickable elements...`);
            console.log(`   Target: ${maxItems} | Found: ${urls.length} valid URLs`);
            console.log(`   Sample URLs:`, urls.slice(0, 5));
            
            let completed = 0;
            let cached = 0;
            let failed = 0;
            
            // Process in batches to avoid overwhelming the backend
            const batchSize = 5;
            for (let i = 0; i < urls.length; i += batchSize) {
                const batch = urls.slice(i, i + batchSize);
                const batchPromises = batch.map(async (url) => {
                    try {
                        await getScreenshot(url);
                        cached++;
                        completed++;
                        return { url, success: true };
                    } catch (error) {
                        failed++;
                        completed++;
                        return { url, success: false, error: error.message };
                    }
                });
                
                const results = await Promise.all(batchPromises);
                console.log(`   [${completed}/${urls.length}] Processed batch - Cached: ${results.filter(r => r.success).length} | Failed: ${results.filter(r => !r.success).length}`);
                
                // Log failures for debugging
                results.filter(r => !r.success).forEach(r => {
                    console.warn(`   ❌ Failed: ${r.url.substring(0, 50)}... - ${r.error}`);
                });
            }
            
            console.log(`✅ Pre-cache complete!`);
            console.log(`   📊 Summary: Cached: ${cached} | Failed: ${failed} | Total: ${urls.length}`);
            
            return { cached, failed, total: urls.length };
        };
        
        // Initialize
        attachToLinks();
        attachDirectListeners();
        observeDOM();
        
        // Also observe iframes
        const iframeObserver = new MutationObserver(() => {
            observeDOM();
        });
        iframeObserver.observe(document.body, { childList: true, subtree: true });
        
        console.log('✅ Tooltip system initialized. Use window.spiderPrecrawl() to pre-cache links.');
    }
})();
