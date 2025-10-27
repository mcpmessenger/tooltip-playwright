# 🔍 Adding OCR to Screenshots in IndexedDB

## Goal: Extract and Store OCR Text with Every Screenshot

**Current:** OCR only runs when chat is used (on-demand)
**New:** OCR runs automatically and text is stored with screenshot in IndexedDB

---

## Implementation Plan

### 1. Add OCR Service Function
Add to `server.js`:
```javascript
async function extractOCRText(screenshot) {
    const { spawnSync } = require('child_process');
    const path = require('path');
    const fs = require('fs');
    
    try {
        // Save to temp file
        const tempPath = path.join(__dirname, 'temp_screenshot.png');
        const base64Data = screenshot.split(',')[1];
        fs.writeFileSync(tempPath, Buffer.from(base64Data, 'base64'));
        
        // Run OCR
        const ocrPath = path.join(__dirname, '..', 'Smart Parser and OCR Integration for API Keys and Annotations', 'ocr_processor.py');
        const env = process.env;
        if (!env.PATH.includes('Tesseract-OCR')) {
            env.PATH = 'C:\\Program Files\\Tesseract-OCR;' + env.PATH;
        }
        
        const result = spawnSync('python', [ocrPath, tempPath], {
            encoding: 'utf8',
            env: env
        });
        
        // Clean up
        fs.unlinkSync(tempPath);
        
        if (result.status === 0) {
            const ocrData = JSON.parse(result.stdout);
            return ocrData.full_text_context || '';
        }
        return '';
    } catch (error) {
        console.error('OCR error:', error.message);
        return '';
    }
}
```

### 2. Store OCR Text with Screenshot
Update `captureScreenshot()` to extract and cache OCR text:

```javascript
async function captureScreenshot(url, extractOCR = false) {
    // ... existing screenshot code ...
    
    const base64Screenshot = screenshot.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Screenshot}`;
    
    // Extract OCR text if requested
    let ocrText = '';
    if (extractOCR) {
        console.log(`🔍 Extracting OCR text for ${url}...`);
        ocrText = await extractOCRText(dataUrl);
        console.log(`✅ OCR text extracted: ${ocrText.substring(0, 100)}...`);
    }
    
    // Cache with OCR text
    screenshotCache.set(url, {
        screenshot: dataUrl,
        ocrText: ocrText,
        timestamp: Date.now()
    });
    
    return dataUrl;
}
```

### 3. Add OCR Text to IndexedDB
Update IndexedDB schema to store OCR text:
```javascript
// In content.js, update saveToIndexedDB
async function saveToIndexedDB(url, screenshotData, ocrText) {
    if (!db) return;
    
    const data = {
        url: url,
        screenshotUrl: screenshotData,
        ocrText: ocrText || '', // NEW: Store OCR text
        timestamp: Date.now()
    };
    
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    await store.put(data);
}
```

### 4. Add Endpoint to Get OCR Text
Add to `server.js`:
```javascript
app.get('/ocr/:url', async (req, res) => {
    const encodedUrl = req.params.url;
    const url = decodeURIComponent(encodedUrl);
    
    // Check cache
    const cacheEntry = screenshotCache.get(url);
    if (cacheEntry && cacheEntry.ocrText) {
        return res.json({ ocrText: cacheEntry.ocrText });
    }
    
    res.json({ ocrText: '' });
});
```

---

## Benefits

### ✅ Immediate Benefits:
- OCR text extracted once, used many times
- Faster than on-demand OCR
- Text available for search/filtering
- Better tooltip descriptions

### ✅ Use Cases:
- Search screenshots by text
- Better AI context in chat
- Accessibility features
- Link descriptions in tooltips

---

## Testing

### 1. Capture with OCR
```bash
curl -X POST http://localhost:3000/capture \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","ocr":true}'
```

### 2. Get OCR Text
```bash
curl http://localhost:3000/ocr/https://example.com
```

### 3. Check IndexedDB
In browser DevTools:
- Application → IndexedDB
- Find entry for URL
- Check `ocrText` field

---

## Performance Considerations

### Option A: Always Extract OCR
- Pros: Text always available
- Cons: Slower captures, more CPU

### Option B: Extract on Demand
- Pros: Faster captures
- Cons: Extra step for chat

### Option C: Background OCR (Recommended)
- Extract OCR after screenshot returns
- Don't block the response
- Store when ready

**I recommend Option C!** ✅

---

## Implementation Choice

**Choose one:**
1. **Always extract OCR** → Slower but complete
2. **Extract in background** → Fast response, OCR later
3. **Add OCR endpoint** → Extract on demand

**Which do you prefer?** 🤔

