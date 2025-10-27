# Local Testing Guide

## 🚀 Quick Start

### Step 1: Install Backend Dependencies

```bash
cd playwright_service
npm install
```

This installs all dependencies including:
- express
- playwright
- cors
- openai (for AI features)

### Step 2: Set Up OpenAI API Key (Optional)

Create a `.env` file in the `playwright_service` directory:

```bash
echo "OPENAI_API_KEY=YOUR_API_KEY_HERE" > .env
```

Replace `YOUR_API_KEY_HERE` with your actual OpenAI API key.

**OR** set it as an environment variable before starting the server:

```bash
# PowerShell
$env:OPENAI_API_KEY="YOUR_API_KEY_HERE"

# Command Prompt
set OPENAI_API_KEY=YOUR_API_KEY_HERE
```

### Step 3: Start the Backend

From the `playwright_service` directory:

```bash
npm start
```

You should see:
```
═══════════════════════════════════════════════════
🚀 Playwright Tooltip Backend Service
═══════════════════════════════════════════════════
📡 Server running on http://localhost:3000
📸 Endpoint: POST http://localhost:3000/capture
🤖 AI Endpoint: POST http://localhost:3000/capture (enableAI: true)
❤️  Health: GET http://localhost:3000/health
```

### Step 4: Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Navigate to your project folder:
   ```
   C:\Users\senti\OneDrive\Desktop\Serverless Deployment Plan and MVP Improvement Suggestions
   ```
5. Click **Select Folder**

### Step 5: Reload Extension After Code Changes

After making any code changes:
1. Go to `chrome://extensions`
2. Find "Playwright Tooltip System"
3. Click the **🔄 Reload** button
4. **Refresh any open tabs** (Ctrl+R)

---

## 🧪 Testing Features

### 1. Test Basic Tooltips

1. Go to any website (e.g., `https://github.com`)
2. Hover over any link for ~0.8 seconds
3. A tooltip should appear showing a screenshot preview
4. Move mouse away - tooltip should disappear

**Expected:** Screenshot appears in tooltip

### 2. Test Right-Click Context Menu

1. Right-click anywhere on the page
2. You should see 3 options:
   - **Enable/Disable Playwright Tooltips**
   - **Precrawl Links (Cache Screenshots)**
   - **Refresh Cache (Clear & Reload)**

**Test Enable/Disable:**
- Select "Disable Playwright Tooltips"
- Try hovering over links - tooltips should NOT appear
- Right-click again and select "Enable"

**Test Precrawl:**
- Right-click → "Precrawl Links"
- Open browser console (F12)
- You should see progress messages like:
  ```
  🕷️ Pre-caching 20 clickable elements...
  [10/20] Processed batch...
  ✅ Pre-cache complete!
  ```

**Test Refresh Cache:**
- Right-click → "Refresh Cache"
- Page should reload
- All cached screenshots are cleared

### 3. Test Chat Widget

1. Look for the **💬** chat button in the bottom-right corner
2. Click it to open the chat widget
3. Try asking questions like:
   - "What is this page about?"
   - "What can I do here?"
   - "Help me understand the navigation"
4. Chat widget should respond (if backend is configured with OpenAI)

**Expected:** AI-powered responses about the current page

### 4. Test Button Detection

1. Visit a page with buttons (e.g., `https://github.com`)
2. Hover over buttons, not just links
3. Tooltips should work on buttons too

### 5. Test Console Functions

Open browser console (F12) and try:

```javascript
// Pre-cache 20 links
await window.spiderPrecrawl(20)

// Check cache status
console.log('Cache:', await chrome.storage.local.get())
```

---

## 🐛 Troubleshooting

### Backend Not Starting

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:** 
1. Find the process using port 3000:
   ```bash
   netstat -ano | findstr :3000
   ```
2. Kill the process (PID is the last number):
   ```bash
   taskkill /PID <number> /F
   ```
3. Restart the backend

### Extension Not Loading

**Error:** "Manifest file is missing or unreadable"

**Solution:**
- Make sure you're selecting the correct folder (the one with `manifest.json`)
- Check that `manifest.json` exists and is valid JSON

### Tooltips Not Appearing

**Check:**
1. Backend is running on `http://localhost:3000`
2. Test backend with:
   ```bash
   curl http://localhost:3000/health
   ```
3. Extension is reloaded after code changes
4. Tooltips are enabled (not disabled via right-click)
5. Open browser console for error messages

### Chat Widget Not Working

**Check:**
1. OpenAI API key is set in `.env` file
2. Backend shows "🤖 OpenAI integration enabled" on start
3. Open browser console for error messages
4. Backend is running and accessible

### Cache Issues

**Clear everything:**
1. Right-click → "Refresh Cache"
2. Or in console:
   ```javascript
   indexedDB.deleteDatabase('playwright-tooltips')
   ```
3. Reload page

---

## 📊 Expected Results

### Backend Health Check

```bash
curl http://localhost:3000/health
```

Should return:
```json
{
  "status": "healthy",
  "browser": "initialized",
  "openai": "configured",
  "cache": {
    "size": 5,
    "entries": ["url1", "url2", ...]
  }
}
```

### Tooltip Behavior

- **First hover:** Takes 1-2 seconds (capturing screenshot)
- **Second hover:** Instant (cached)
- **After 5 minutes:** Cache expires, captures fresh screenshot

### Chat Widget

- **Without OpenAI:** "OpenAI is not configured"
- **With OpenAI:** Contextual answers about the page

---

## 🎯 Testing Checklist

- [ ] Backend starts without errors
- [ ] Extension loads in Chrome
- [ ] Basic tooltips appear on link hover
- [ ] Buttons also show tooltips
- [ ] Right-click menu appears with 3 options
- [ ] Enable/Disable toggle works
- [ ] Precrawl function works
- [ ] Cache refresh works
- [ ] Chat widget appears
- [ ] Chat widget responds (with API key)
- [ ] Console functions work
- [ ] No errors in browser console

---

## 💡 Pro Tips

1. **Test on different sites:**
   - GitHub
   - Wikipedia
   - Reddit
   - Personal sites

2. **Monitor the backend console** for debugging

3. **Use F12 Developer Tools** to see extension messages

4. **Reload extension often** during development

5. **Check Network tab** in DevTools to see API calls

---

## 🚨 Common Issues

### "Refused to execute inline event handler"

This is expected on sites with Content Security Policy. It doesn't affect functionality.

### "Failed to fetch screenshot"

- Backend might be down
- URL might require authentication
- Check backend console for errors

### Chat widget not appearing

- Check console for JavaScript errors
- Make sure extension is reloaded
- Check that content.js is properly injected

---

## 📞 Need Help?

Check the following files for more info:
- `README.md` - Overview
- `RELOAD_INSTRUCTIONS.md` - How to reload
- `TESTING_NOTES.md` - Additional test cases
- `playwright_service/README.md` - Backend details

