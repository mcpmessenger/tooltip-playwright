# 🔍 How to Use OCR Text from Screenshots

## ✅ What's New

Every screenshot now gets OCR text extracted automatically in the background!

---

## 🎯 How It Works

### Automatic OCR Extraction
1. Screenshot is captured
2. Screenshot is returned immediately (fast tooltip!)
3. OCR extraction runs in background (non-blocking)
4. OCR text is stored with screenshot in cache

### When OCR is Used
- **Chat endpoint**: Uses OCR text for better AI context
- **Search/Filter**: Can search screenshots by text
- **Accessibility**: Text descriptions for images

---

## 🚀 How to Get OCR Text

### Method 1: Via API Endpoint

```bash
# Get OCR text for a screenshot
curl "http://localhost:3000/ocr/https://example.com"

# Response:
{
  "url": "https://example.com",
  "ocrText": "Example Domain This domain is for use in...",
  "ocrTimestamp": 1698576000000
}
```

### Method 2: In Chat

The chat endpoint **automatically uses OCR text** when available:

```bash
# Chat request (uses OCR text automatically)
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What does this page say?",
    "url": "https://example.com"
  }'
```

The OCR text is included in the AI context automatically!

---

## 📊 Check If OCR is Available

### Get Health Stats

```bash
curl http://localhost:3000/health
```

### Check Cache Entry

Look in server logs:
```
🔍 Starting background OCR for https://example.com...
✅ OCR text extracted and cached for https://example.com (250 chars)
```

---

## 🧪 Testing

### 1. Capture a Screenshot
```bash
curl -X POST http://localhost:3000/capture \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

**Watch the logs:**
```
✅ Screenshot captured: https://example.com
🔍 Starting background OCR for https://example.com...
✅ OCR text extracted and cached (250 chars)
```

### 2. Get OCR Text
```bash
curl "http://localhost:3000/ocr/https://example.com"
```

**Response:**
```json
{
  "url": "https://example.com",
  "ocrText": "Example Domain\n\nThis domain is for use in illustrative...",
  "ocrTimestamp": 1698576000000
}
```

### 3. Use in Chat
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Summarize this page",
    "url": "https://example.com"
  }'
```

**The AI will automatically use the OCR text for better context!**

---

## 💡 Use Cases

### 1. Better AI Context
Chat responses are more accurate with OCR text:
```
User: "What does this page say about pricing?"
AI: Uses OCR text to understand the page content
```

### 2. Screenshot Search
Find screenshots by searching their text:
```javascript
// Get all cached URLs
const urls = Array.from(screenshotCache.keys());

// Check OCR text for each
urls.forEach(url => {
  const entry = screenshotCache.get(url);
  if (entry.ocrText && entry.ocrText.includes('search term')) {
    console.log('Found!', url);
  }
});
```

### 3. Accessibility
Provide text descriptions for images in tooltips.

---

## ⚡ Performance

### Screenshots (No Change)
- Still instant (<500ms)
- OCR runs in background
- Doesn't block tooltips

### Chat (Faster!)
- **With cached OCR:** Instant response
- **Without cached OCR:** Falls back to on-demand OCR
- Best of both worlds!

### Storage
- OCR text cached in memory
- Small overhead (~1-5KB per screenshot)
- Automatically cleaned with cache expiry

---

## 🎛️ Configuration

### Requirements
- Python installed
- Tesseract OCR installed
- Python packages: `pytesseract`, `Pillow`

### Check Installation

```bash
# Check Tesseract
tesseract --version

# Check Python packages
pip list | grep pytesseract
pip list | grep Pillow
```

---

## 📈 What to Expect

### Timing
1. Screenshot captured: **Immediate** (~1-2s)
2. OCR extraction starts: **Background** (non-blocking)
3. OCR completes: **~5-10 seconds later**
4. OCR text cached: **Available via API**

### Console Logs
```
📸 Capturing screenshot: https://example.com
✅ Screenshot captured: https://example.com
[Tooltip appears instantly for user]

[Background OCR running...]
🔍 Starting background OCR for https://example.com...
✅ OCR text extracted and cached (250 chars)
```

---

## 🐛 Troubleshooting

### Issue: OCR text not available
**Wait a few seconds** - OCR runs in background after screenshot is captured.

### Issue: "OCR text not available yet"
This means OCR is still processing. Wait 5-10 seconds and try again.

### Issue: OCR errors in logs
Check:
- Tesseract is installed?
- Python path correct?
- pytesseract installed?

---

## ✅ Summary

**What you get:**
- ✅ Automatic OCR on every screenshot
- ✅ Background processing (doesn't slow tooltips)
- ✅ Cached OCR text for fast chat responses
- ✅ API endpoint to retrieve OCR text
- ✅ Search screenshots by text

**How to use:**
1. Screenshots work as before (instant tooltips)
2. OCR text extracted automatically in background
3. Use `/ocr/:url` endpoint to get text
4. Chat automatically uses OCR for better context

**It's all automatic!** 🎉

