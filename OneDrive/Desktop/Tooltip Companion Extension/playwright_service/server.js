// server.js - Tooltip Companion Backend Service
// AI-powered screenshots and context-aware assistance for web pages

require('dotenv').config();
const express = require('express');
const { chromium } = require('playwright');
const cors = require('cors');
const OpenAI = require('openai');

// Simple in-memory queue for request management
class RequestQueue {
    constructor() {
        this.queue = [];
        this.processing = new Set();
        this.maxConcurrent = 3;
    }
    
    async add(fn, priority = 0) {
        return new Promise((resolve, reject) => {
            this.queue.push({ fn, priority, resolve, reject });
            this.queue.sort((a, b) => b.priority - a.priority);
            this.process();
        });
    }
    
    async process() {
        while (this.queue.length > 0 && this.processing.size < this.maxConcurrent) {
            const item = this.queue.shift();
            this.processing.add(item);
            
            try {
                const result = await item.fn();
                item.resolve(result);
            } catch (error) {
                item.reject(error);
            } finally {
                this.processing.delete(item);
            }
        }
    }
    
    getStats() {
        return {
            queueLength: this.queue.length,
            processing: this.processing.size,
            maxConcurrent: this.maxConcurrent
        };
    }
}

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI client (optional)
let openaiClient = null;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (OPENAI_API_KEY && OPENAI_API_KEY !== 'YOUR_API_KEY_HERE') {
    openaiClient = new OpenAI({
        apiKey: OPENAI_API_KEY
    });
    console.log('🤖 OpenAI integration enabled');
}

// Middleware
app.use(cors());
app.use(express.json());

// Browser Pool Class
class BrowserPool {
    constructor(size = 3) {
        this.size = size;
        this.instances = [];
        this.available = [];
        this.inUse = new Set();
        this.initialized = false;
    }
    
    async init() {
        if (this.initialized) return;
        
        console.log(`🚀 Initializing browser pool with ${this.size} instances...`);
        
        for (let i = 0; i < this.size; i++) {
            try {
                const browser = await chromium.launch({
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-gpu',
                        '--disable-extensions',
                        '--disable-logging',
                        '--disable-software-rasterizer',
                        '--disable-dev-shm-usage',
                        '--no-first-run',
                        '--no-default-browser-check'
                    ]
                });
                this.instances.push(browser);
                this.available.push(browser);
                console.log(`✅ Browser instance ${i + 1}/${this.size} created`);
            } catch (error) {
                console.error(`❌ Failed to create browser instance ${i + 1}:`, error);
            }
        }
        
        this.initialized = true;
        console.log(`✅ Browser pool initialized with ${this.available.length} instances`);
    }
    
    async acquire() {
        if (!this.initialized) await this.init();
        
        // Return available instance if pool has one
        if (this.available.length > 0) {
            const instance = this.available.shift();
            this.inUse.add(instance);
            console.log(`📥 Browser acquired. Available: ${this.available.length}, In use: ${this.inUse.size}`);
            return instance;
        }
        
        // If all busy, create temporary instance (shouldn't happen often)
        console.log('⚠️ All browser instances busy, creating temporary instance');
        const instance = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        return instance;
    }
    
    release(instance) {
        // Check if it's a pool instance or temporary
        if (this.instances.includes(instance)) {
            this.inUse.delete(instance);
            this.available.push(instance);
            console.log(`📤 Browser released. Available: ${this.available.length}, In use: ${this.inUse.size}`);
        } else {
            // Temporary instance - close it
            instance.close().catch(() => {});
        }
    }
    
    async shutdown() {
        console.log('🛑 Shutting down browser pool...');
        for (const instance of this.instances) {
            try {
                await instance.close();
            } catch (error) {
                console.error('Error closing browser instance:', error);
            }
        }
        this.instances = [];
        this.available = [];
        this.inUse.clear();
        this.initialized = false;
    }
    
    getStats() {
        return {
            totalInstances: this.instances.length,
            availableInstances: this.available.length,
            inUseInstances: this.inUse.size,
            poolSize: this.size,
            isInitialized: this.initialized
        };
    }
}

// State
const browserPool = new BrowserPool(3); // 3 pre-warmed instances
const requestQueue = new RequestQueue(); // Request queue for managing bursts
let screenshotCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Clean up browser pool on exit
process.on('SIGINT', async () => {
    console.log('\n⚠️ Shutting down...');
    await browserPool.shutdown();
    process.exit(0);
});

// Check cache
function isCacheValid(timestamp) {
    return (Date.now() - timestamp) < CACHE_TTL;
}

// Extract OCR text from screenshot (background processing)
function extractOCRTextAsync(screenshotDataUrl, url) {
    // Run asynchronously - don't block
    setImmediate(async () => {
        try {
            const { spawnSync } = require('child_process');
            const path = require('path');
            const fs = require('fs');
            
            console.log(`🔍 Starting background OCR for ${url}...`);
            
            // Save to temp file
            const tempPath = path.join(__dirname, 'temp_ocr_' + Date.now() + '.png');
            const base64Data = screenshotDataUrl.split(',')[1];
            fs.writeFileSync(tempPath, Buffer.from(base64Data, 'base64'));
            
            // Run OCR
            const ocrPath = path.join(__dirname, '..', 'Smart Parser and OCR Integration for API Keys and Annotations', 'ocr_processor.py');
            
            const env = { ...process.env };
            // Ensure PATH exists before checking
            if (!env.PATH) {
                env.PATH = 'C:\\Program Files\\Tesseract-OCR';
            } else if (typeof env.PATH === 'string' && !env.PATH.includes('Tesseract-OCR')) {
                env.PATH = 'C:\\Program Files\\Tesseract-OCR;' + env.PATH;
            }
            
            const result = spawnSync('python', [ocrPath, tempPath], {
                encoding: 'utf8',
                env: env
            });
            
            // Clean up
            fs.unlinkSync(tempPath);
            
            if (result.status === 0 && result.stdout) {
                try {
                    const ocrData = JSON.parse(result.stdout);
                    const ocrText = ocrData.full_text_context || '';
                    
                    // Update cache with OCR text
                    const cacheEntry = screenshotCache.get(url);
                    if (cacheEntry) {
                        cacheEntry.ocrText = ocrText;
                        cacheEntry.ocrTimestamp = Date.now();
                        console.log(`✅ OCR text extracted and cached for ${url} (${ocrText.length} chars)`);
                    }
                } catch (parseError) {
                    console.error('OCR parse error:', parseError.message);
                }
            }
            
        } catch (error) {
            console.error('OCR extraction error:', error.message);
        }
    });
}

// Capture screenshot
async function captureScreenshot(url) {
    let browserInstance = null;
    
    try {
        // Check cache
        const cacheEntry = screenshotCache.get(url);
        if (cacheEntry && isCacheValid(cacheEntry.timestamp)) {
            console.log(`📦 Cache hit: ${url}`);
            return cacheEntry.screenshot;
        }

        console.log(`📸 Capturing screenshot: ${url}`);
        
        // Acquire browser from pool
        browserInstance = await browserPool.acquire();
        
        const context = await browserInstance.newContext({
            viewport: { width: 1280, height: 720 }
        });
        
        const page = await context.newPage();
        
        // Navigate to URL with extended timeout for slow sites
        await page.goto(url, { 
            waitUntil: 'networkidle',
            timeout: 90000  // 90 seconds for very slow sites like banking portals
        });
        
        // Wait for page to be fully interactive
        await page.waitForLoadState('domcontentloaded');
        
        // Wait for network to be completely idle (no requests for 500ms)
        await page.waitForLoadState('networkidle');
        
        // Additional wait for dynamic content to fully render (esp. important for banking/slow sites)
        await page.waitForTimeout(3000); // Wait 3 seconds for banking sites with heavy JavaScript
        
        // Wait for page to be completely stable
        await page.waitForTimeout(1000);
        
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
            timestamp: Date.now(),
            ocrText: '', // Will be populated by background OCR
            ocrTimestamp: null
        });
        
        console.log(`✅ Screenshot captured: ${url}`);
        
        // Extract OCR text in background (non-blocking)
        extractOCRTextAsync(dataUrl, url);
        
        return dataUrl;
        
    } catch (error) {
        console.error(`❌ Error capturing screenshot for ${url}:`, error.message);
        throw error;
    } finally {
        // Always release browser back to pool
        if (browserInstance) {
            browserPool.release(browserInstance);
        }
    }
}

// Routes
app.get('/', (req, res) => {
    res.json({
        status: 'running',
        service: 'Tooltip Companion Backend',
        version: '1.2.0',
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
        
        // Capture screenshot through queue (handles bursts)
        const screenshot = await requestQueue.add(async () => {
            return await captureScreenshot(url);
        }, 0); // Priority 0 (normal)
        
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

// Chat endpoint for AI assistance with full browser context
app.post('/chat', async (req, res) => {
    try {
        const { message, url, consoleLogs, pageInfo, openaiKey } = req.body;
        
        // Use provided API key or fallback to environment key
        let clientToUse = openaiClient;
        if (openaiKey && openaiKey.trim()) {
            clientToUse = new OpenAI({ apiKey: openaiKey.trim() });
            console.log('🤖 Using user-provided OpenAI API key');
        }
        
        if (!clientToUse) {
            return res.json({ reply: '⚠️ OpenAI API key not configured. Please set your API key in the extension options (click the extension icon → Options).' });
        }
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        console.log(`💬 Chat request: "${message}"`);
        
        // Build comprehensive context
        let context = `Current Page: ${url}\n`;
        
        // Capture screenshot of current page if not in cache
        if (url) {
            let cacheEntry = screenshotCache.get(url);
            
            // If no cached screenshot for current page, capture it now
            if (!cacheEntry || !cacheEntry.screenshot) {
                console.log('📸 No cached screenshot for current page, capturing now...');
                try {
                    const screenshot = await captureScreenshot(url);
                    screenshotCache.set(url, {
                        screenshot: screenshot,
                        timestamp: Date.now()
                    });
                    cacheEntry = screenshotCache.get(url);
                    console.log('✅ Current page screenshot captured');
                } catch (error) {
                    console.error('❌ Failed to capture current page screenshot:', error.message);
                }
            }
            if (cacheEntry && cacheEntry.analysis) {
                context += `\n📸 Screenshot Analysis:\n`;
                context += `- Site Focus: ${cacheEntry.analysis.site_focus}\n`;
                context += `- Capabilities: ${cacheEntry.analysis.site_capabilities.join(', ')}\n`;
                context += `- User Intent: ${cacheEntry.analysis.user_task_hypothesis}\n`;
                context += `- Suggestions: ${cacheEntry.analysis.suggestions.join(', ')}\n`;
            }
            
            // Use cached OCR text if available, otherwise extract on demand
            if (cacheEntry && cacheEntry.screenshot) {
                try {
                    // First check if OCR text is already cached
                    if (cacheEntry.ocrText && cacheEntry.ocrText.trim()) {
                        console.log('✅ Using cached OCR text');
                        const textPreview = cacheEntry.ocrText.substring(0, 200);
                        context += `\n📝 Page Text Content (OCR - Cached):\n${cacheEntry.ocrText.substring(0, 500)}\n`;
                        console.log('✅ OCR context added from cache. Extracted text preview:', textPreview);
                    } else {
                        console.log('🔍 Starting OCR processing for screenshot (not cached)...');
                        const { spawnSync } = require('child_process');
                        const path = require('path');
                        const fs = require('fs');
                        
                        // Save screenshot to temp file for OCR
                        const tempImagePath = path.join(__dirname, 'temp_screenshot.png');
                        const base64Data = cacheEntry.screenshot.split(',')[1];
                        fs.writeFileSync(tempImagePath, Buffer.from(base64Data, 'base64'));
                        console.log('💾 Screenshot saved to temp file for OCR');
                        
                        // Call OCR processor synchronously
                        const ocrPath = path.join(__dirname, '..', 'Smart Parser and OCR Integration for API Keys and Annotations', 'ocr_processor.py');
                        
                        if (fs.existsSync(ocrPath)) {
                            console.log('🎯 Running OCR script...');
                            // Set PATH to include Tesseract if not already there
                            const env = { ...process.env };
                            // Ensure PATH exists before checking
                            if (!env.PATH) {
                                env.PATH = 'C:\\Program Files\\Tesseract-OCR';
                            } else if (typeof env.PATH === 'string' && !env.PATH.includes('Tesseract-OCR')) {
                                env.PATH = 'C:\\Program Files\\Tesseract-OCR;' + env.PATH;
                            }
                            
                            const ocrResult = spawnSync('python', [ocrPath, tempImagePath], {
                                cwd: path.dirname(ocrPath),
                                encoding: 'utf8',
                                env: env
                            });
                            
                            // Clean up temp file
                            fs.unlinkSync(tempImagePath);
                            
                            if (ocrResult.status === 0 && ocrResult.stdout) {
                                try {
                                    const ocrData = JSON.parse(ocrResult.stdout);
                                    if (ocrData.full_text_context && !ocrData.error) {
                                        const textPreview = ocrData.full_text_context.substring(0, 200);
                                        context += `\n📝 Page Text Content (OCR):\n${ocrData.full_text_context.substring(0, 500)}\n`;
                                        console.log('✅ OCR context added. Extracted text preview:', textPreview);
                                    } else if (ocrData.error) {
                                        console.warn('⚠️ OCR returned error:', ocrData.error);
                                    }
                                } catch (parseError) {
                                    console.error('❌ OCR parse error:', parseError.message);
                                }
                            } else {
                                console.error('❌ OCR failed. Status:', ocrResult.status);
                                if (ocrResult.stderr) {
                                    console.error('❌ OCR error output:', ocrResult.stderr);
                                }
                            }
                        } else {
                            console.warn('⚠️ OCR script not found at:', ocrPath);
                            fs.unlinkSync(tempImagePath);
                        }
                    }
                } catch (ocrError) {
                    console.error('❌ OCR processing error:', ocrError.message);
                    console.error('❌ OCR error stack:', ocrError.stack);
                }
            }
        }
        
        // Add console logs if available
        if (consoleLogs && consoleLogs.length > 0) {
            context += `\n📊 Recent Console Logs:\n`;
            consoleLogs.slice(-10).forEach((log, i) => {
                const level = log.level || 'log';
                const msg = log.message || log;
                context += `${i + 1}. [${level}] ${msg}\n`;
            });
        }
        
        // Add page info if available
        if (pageInfo) {
            context += `\n📄 Page Information:\n`;
            context += `- Title: ${pageInfo.title}\n`;
            if (pageInfo.description) context += `- Description: ${pageInfo.description}\n`;
        }
        
        // Get AI response with comprehensive context
        const response = await clientToUse.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: `You are an advanced AI browser assistant helping users understand and interact with web pages. You have access to:

- Screenshot analysis of the current page
- Console logs from the browser
- Page metadata and information
- Real-time browser state

Context:
${context}

Provide helpful, specific, and actionable responses. If you see errors in console logs, help debug them. Be concise but thorough.`
                },
                {
                    role: 'user',
                    content: message
                }
            ],
            max_tokens: 500,
            temperature: 0.7
        });
        
        const reply = response.choices[0].message.content;
        console.log(`✅ Chat response generated`);
        
        res.json({ reply });
        
    } catch (error) {
        console.error('❌ Chat error:', error.message);
        res.status(500).json({ error: 'Failed to process chat request', details: error.message });
    }
});

// Voice transcription endpoint using OpenAI Whisper
app.post('/transcribe', async (req, res) => {
    try {
        const { audio } = req.body;
        
        // Use provided API key or fallback to environment key
        let clientToUse = openaiClient;
        const requestKey = req.body.openaiKey;
        if (requestKey && requestKey.trim()) {
            clientToUse = new OpenAI({ apiKey: requestKey.trim() });
        }
        
        if (!clientToUse) {
            return res.json({ text: null, error: 'OpenAI API key not configured' });
        }
        
        if (!audio) {
            return res.status(400).json({ error: 'Audio data is required' });
        }
        
        console.log('🎤 Transcribing audio...');
        
        // Convert base64 to buffer
        const audioBuffer = Buffer.from(audio, 'base64');
        
        // Create a temporary file for OpenAI Whisper API
        const fs = require('fs');
        const path = require('path');
        const tempFilePath = path.join(__dirname, 'temp_audio.webm');
        
        // Write buffer to file
        fs.writeFileSync(tempFilePath, audioBuffer);
        
        // Create file object for OpenAI
        const fileStream = fs.createReadStream(tempFilePath);
        
        // Transcribe using OpenAI Whisper
        const transcription = await clientToUse.audio.transcriptions.create({
            file: fileStream,
            model: 'whisper-1',
            language: 'en'
        });
        
        // Clean up temp file
        fs.unlinkSync(tempFilePath);
        
        console.log('✅ Transcribed:', transcription.text);
        
        res.json({ text: transcription.text });
        
    } catch (error) {
        console.error('❌ Transcription error:', error.message);
        res.status(500).json({ error: 'Failed to transcribe audio', details: error.message });
    }
});

// Parse API key from natural language text
app.post('/parse-key', async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }
        
        console.log('🔑 Parsing API key from text...');
        
        // Call Python script to parse API key
        const { spawn } = require('child_process');
        const path = require('path');
        const fs = require('fs');
        
        // Check if the parser script exists
        const parserPath = path.join(__dirname, '..', 'Smart Parser and OCR Integration for API Keys and Annotations', 'api_key_parser.py');
        
        if (!fs.existsSync(parserPath)) {
            return res.status(500).json({ 
                error: 'Parser script not found',
                message: 'API key parser not available. Please ensure Python environment is configured.'
            });
        }
        
        // Spawn Python process with text as argument
        const pythonProcess = spawn('python', [parserPath, text], {
            cwd: path.dirname(parserPath)
        });
        
        let output = '';
        let errorOutput = '';
        
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error('❌ Parser error:', errorOutput);
                return res.status(500).json({ 
                    error: 'Parser execution failed', 
                    details: errorOutput 
                });
            }
            
            try {
                const result = JSON.parse(output);
                console.log('✅ Parsed API key:', result.api_key ? 'Found' : 'Not found');
                res.json(result);
            } catch (parseError) {
                console.error('❌ Parse error:', parseError);
                res.status(500).json({ 
                    error: 'Failed to parse parser output', 
                    details: parseError.message 
                });
            }
        });
        
    } catch (error) {
        console.error('❌ Parse key error:', error.message);
        res.status(500).json({ error: 'Failed to process parse request', details: error.message });
    }
});

// Get OCR text for a screenshot
app.get('/ocr', (req, res) => {
    const url = req.query.url;
    
    if (!url) {
        return res.status(400).json({
            error: 'Missing url parameter',
            message: 'Please provide ?url=https://example.com'
        });
    }
    
    // Check cache
    const cacheEntry = screenshotCache.get(url);
    if (cacheEntry && cacheEntry.ocrText && cacheEntry.ocrText.trim()) {
        return res.json({
            url: url,
            ocrText: cacheEntry.ocrText,
            ocrTimestamp: cacheEntry.ocrTimestamp,
            status: 'success'
        });
    }
    
    res.json({
        url: url,
        ocrText: '',
        message: 'OCR text not available yet (still processing)',
        status: 'processing'
    });
});

// OCR upload endpoint for live image uploads
app.post('/ocr-upload', async (req, res) => {
    try {
        const { image } = req.body;
        
        if (!image) {
            return res.status(400).json({
                error: 'Missing image parameter',
                message: 'Please provide an image in base64 format'
            });
        }
        
        console.log('📷 Processing uploaded image for OCR...');
        
        // Extract base64 data
        const base64Data = image.includes(',') ? image.split(',')[1] : image;
        
        // Save to temp file
        const fs = require('fs');
        const path = require('path');
        const tempPath = path.join(__dirname, 'temp_upload_' + Date.now() + '.png');
        
        fs.writeFileSync(tempPath, Buffer.from(base64Data, 'base64'));
        
        // Run OCR
        const { spawnSync } = require('child_process');
        const ocrPath = path.join(__dirname, '..', 'Smart Parser and OCR Integration for API Keys and Annotations', 'ocr_processor.py');
        
        const env = { ...process.env };
        if (!env.PATH) {
            env.PATH = 'C:\\Program Files\\Tesseract-OCR';
        } else if (typeof env.PATH === 'string' && !env.PATH.includes('Tesseract-OCR')) {
            env.PATH = 'C:\\Program Files\\Tesseract-OCR;' + env.PATH;
        }
        
        const result = spawnSync('python', [ocrPath, tempPath], {
            encoding: 'utf8',
            env: env
        });
        
        // Clean up
        fs.unlinkSync(tempPath);
        
        if (result.status === 0 && result.stdout) {
            try {
                const ocrData = JSON.parse(result.stdout);
                if (ocrData.full_text_context && !ocrData.error) {
                    console.log(`✅ OCR extracted ${ocrData.full_text_context.length} characters`);
                    return res.json({
                        status: 'success',
                        ocrText: ocrData.full_text_context,
                        characterCount: ocrData.full_text_context.length
                    });
                } else if (ocrData.error) {
                    return res.json({
                        status: 'error',
                        error: ocrData.error
                    });
                }
            } catch (parseError) {
                console.error('OCR parse error:', parseError.message);
            }
        }
        
        res.json({
            status: 'error',
            error: 'Failed to extract OCR text from uploaded image'
        });
        
    } catch (error) {
        console.error('❌ OCR upload error:', error.message);
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    const poolStats = browserPool.getStats();
    const queueStats = requestQueue.getStats();
    
    res.json({
        status: 'healthy',
        pool: poolStats,
        queue: queueStats,
        openai: openaiClient ? 'configured' : 'not configured',
        cache: {
            size: screenshotCache.size,
            entries: Array.from(screenshotCache.keys()).slice(0, 10) // Limit entries
        }
    });
});

// Start server
async function start() {
    // Initialize browser pool
    await browserPool.init();
    
    app.listen(PORT, () => {
        console.log('\n═══════════════════════════════════════════════════');
        console.log('🚀 Tooltip Companion Backend Service');
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

