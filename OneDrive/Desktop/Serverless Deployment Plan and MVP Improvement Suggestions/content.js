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
    chrome.storage.sync.get({ backendUrl: 'http://localhost:3000', tooltipsEnabled: true }, (items) => {
        const BACKEND_SERVICE_URL = items.backendUrl.replace(/\/$/, ''); // Remove trailing slash
        const TOOLTIPS_ENABLED = items.tooltipsEnabled;
        
        const status = TOOLTIPS_ENABLED ? '✅ ENABLED' : '❌ DISABLED';
        console.log(`${status} Playwright tooltips via Browser Extension!`);
    console.log(`   Backend Service URL: ${BACKEND_SERVICE_URL}`);
        console.log(`   Toggle: Right-click → ${TOOLTIPS_ENABLED ? 'Disable' : 'Enable'} Playwright Tooltips`);
        
        // Initialize the tooltip system
        initTooltipSystem(BACKEND_SERVICE_URL, TOOLTIPS_ENABLED);
    });
    
    // Listen for toggle messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'toggle-tooltips') {
            const status = request.enabled ? '✅ ENABLED' : '❌ DISABLED';
            console.log(`Tooltips ${status}`);
            
            // Update the enabled state if initTooltipSystem is available
            if (window.tooltipsEnabled !== undefined) {
                window.tooltipsEnabled = request.enabled;
            }
        }
        sendResponse({ success: true });
    });
    
    function initTooltipSystem(BACKEND_SERVICE_URL, tooltipsEnabled = true) {
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
                tooltipDiv.innerHTML = `<img src="${screenshotUrl}" 
                    style="display: block; width: 100%; height: auto; max-height: ${MAX_TOOLTIP_HEIGHT}px; object-fit: cover;" 
                    alt="Link preview" 
                    onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=&quot;padding: 20px; text-align: center; color: #d32f2f;&quot;>⚠️ Failed to load preview</div>'">`;
            } else {
                tooltipDiv.innerHTML = `<div style="padding: 20px; text-align: center; color: #666;">Loading preview...</div>`;
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
        
        // Fetch screenshot from backend
        async function fetchScreenshot(url) {
            try {
                console.log(`📸 Fetching screenshot for: ${url}`);
            const response = await fetch(`${BACKEND_SERVICE_URL}/capture`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
                
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
                
                // Also save to IndexedDB for persistence
                await saveToIndexedDB(url, blobUrl);
                
                console.log(`✅ Screenshot cached successfully`);
                return blobUrl;
        } catch (error) {
                console.error(`Failed to fetch screenshot for ${url}:`, error);
                throw error;
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
                            // Also update memory cache
                            cache.set(url, request.result);
                            resolve(request.result.screenshotUrl);
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
        async function saveToIndexedDB(url, screenshotUrl) {
            if (!db) return;
            
            try {
                const data = {
                    url: url,
                    screenshotUrl: screenshotUrl,
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
            
            // Check for buttons
            if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') return true;
            
            // Check for elements with onclick handlers
            if (element.onclick || element.getAttribute('onclick')) return true;
            
            // Check for elements with data-clickable or role attributes
            if (element.dataset.clickable || element.getAttribute('role') === 'link') return true;
            
            // Check for anchor tags (even without href)
            if (element.tagName === 'A') return true;
            
            // Check for clickable divs/spans with specific attributes
            if (element.dataset.href || element.dataset.url || element.dataset.to || element.dataset.path) return true;
            
            // Check for common clickable patterns (LinkedIn, Twitter, etc.)
            const clickableClasses = ['clickable', 'button', 'link', 'nav-item', 'action', 'btn', 'card', 'tile', 'item'];
            const classList = (element.className || '').toLowerCase();
            const id = (element.id || '').toLowerCase();
            
            // Check if class name contains clickable indicators
            if (clickableClasses.some(cls => classList.includes(cls))) return true;
            
            // Check if element is inside a link
            const parentLink = element.closest('a[href]');
            if (parentLink && parentLink.href) return true;
            
            // Check cursor style (might indicate clickability)
            if (style.cursor === 'pointer') return true;
            
            // Check for common framework attributes
            if (element.dataset.testid || element.dataset.cy || element.dataset.testId) {
                const url = getElementUrl(element);
                if (url) return true;
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
