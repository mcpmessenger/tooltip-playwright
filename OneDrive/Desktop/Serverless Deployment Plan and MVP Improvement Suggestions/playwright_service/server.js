// server.js - Playwright Tooltip Backend Service
// Captures screenshots of web pages on demand

const express = require('express');
const { chromium } = require('playwright');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// State
let browser = null;
let screenshotCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Initialize browser
async function initBrowser() {
    if (!browser) {
        console.log('🚀 Initializing Playwright browser...');
        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        console.log('✅ Browser initialized');
    }
    return browser;
}

// Clean up browser on exit
process.on('SIGINT', async () => {
    console.log('\n⚠️ Shutting down...');
    if (browser) {
        await browser.close();
    }
    process.exit(0);
});

// Check cache
function isCacheValid(timestamp) {
    return (Date.now() - timestamp) < CACHE_TTL;
}

// Capture screenshot
async function captureScreenshot(url) {
    try {
        // Check cache
        const cacheEntry = screenshotCache.get(url);
        if (cacheEntry && isCacheValid(cacheEntry.timestamp)) {
            console.log(`📦 Cache hit: ${url}`);
            return cacheEntry.screenshot;
        }

        console.log(`📸 Capturing screenshot: ${url}`);
        
        const browserInstance = await initBrowser();
        const context = await browserInstance.newContext({
            viewport: { width: 1280, height: 720 }
        });
        
        const page = await context.newPage();
        
        // Navigate to URL
        await page.goto(url, { 
            waitUntil: 'networkidle',
            timeout: 30000 
        });
        
        // Take screenshot
        const screenshot = await page.screenshot({
            fullPage: false,
            type: 'png'
        });
        
        // Close context
        await context.close();
        
        // Convert to base64
        const base64Screenshot = screenshot.toString('base64');
        const dataUrl = `data:image/png;base64,${base64Screenshot}`;
        
        // Cache the result
        screenshotCache.set(url, {
            screenshot: dataUrl,
            timestamp: Date.now()
        });
        
        console.log(`✅ Screenshot captured: ${url}`);
        return dataUrl;
        
    } catch (error) {
        console.error(`❌ Error capturing screenshot for ${url}:`, error.message);
        throw error;
    }
}

// Routes
app.get('/', (req, res) => {
    res.json({
        status: 'running',
        service: 'Playwright Tooltip Backend',
        version: '1.0.0',
        endpoint: 'POST /capture',
        usage: {
            method: 'POST',
            path: '/capture',
            body: { url: 'https://example.com' }
        }
    });
});

app.post('/capture', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({
                error: 'Missing url parameter',
                message: 'Please provide a url in the request body: { "url": "https://example.com" }'
            });
        }
        
        // Validate URL
        try {
            new URL(url);
        } catch (error) {
            return res.status(400).json({
                error: 'Invalid URL',
                message: 'Please provide a valid URL'
            });
        }
        
        // Capture screenshot
        const screenshot = await captureScreenshot(url);
        
        // Send response
        res.json({ screenshot });
        
    } catch (error) {
        console.error('❌ Capture error:', error.message);
        res.status(500).json({
            error: 'Failed to capture screenshot',
            message: error.message
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        browser: browser ? 'initialized' : 'not initialized',
        cache: {
            size: screenshotCache.size,
            entries: Array.from(screenshotCache.keys())
        }
    });
});

// Start server
async function start() {
    await initBrowser();
    
    app.listen(PORT, () => {
        console.log('\n═══════════════════════════════════════════════════');
        console.log('🚀 Playwright Tooltip Backend Service');
        console.log('═══════════════════════════════════════════════════');
        console.log(`📡 Server running on http://localhost:${PORT}`);
        console.log(`📸 Endpoint: POST http://localhost:${PORT}/capture`);
        console.log(`❤️  Health: GET http://localhost:${PORT}/health`);
        console.log('═══════════════════════════════════════════════════\n');
        console.log('💡 Send a POST request with:');
        console.log('   { "url": "https://example.com" }');
        console.log('\n⏳ Waiting for requests...\n');
    });
}

// Start the server
start().catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});

