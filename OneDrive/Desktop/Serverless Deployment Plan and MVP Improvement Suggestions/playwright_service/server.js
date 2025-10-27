// server.js - Tooltip Companion Backend Service
// AI-powered screenshots and context-aware assistance for web pages

require('dotenv').config();
const express = require('express');
const { chromium } = require('playwright');
const cors = require('cors');
const OpenAI = require('openai');

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
        
        // Get screenshot analysis from cache
        if (url) {
            const cacheEntry = screenshotCache.get(url);
            if (cacheEntry && cacheEntry.analysis) {
                context += `\n📸 Screenshot Analysis:\n`;
                context += `- Site Focus: ${cacheEntry.analysis.site_focus}\n`;
                context += `- Capabilities: ${cacheEntry.analysis.site_capabilities.join(', ')}\n`;
                context += `- User Intent: ${cacheEntry.analysis.user_task_hypothesis}\n`;
                context += `- Suggestions: ${cacheEntry.analysis.suggestions.join(', ')}\n`;
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

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        browser: browser ? 'initialized' : 'not initialized',
        openai: openaiClient ? 'configured' : 'not configured',
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

