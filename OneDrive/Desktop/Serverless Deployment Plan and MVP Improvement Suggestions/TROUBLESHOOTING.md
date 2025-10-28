# Playwright Tooltip System - Troubleshooting Guide

## 🚨 Common Issues and Solutions

### Issue 1: "Backend service unavailable" Error

**Symptoms:**
- Chat shows "Backend service unavailable. Make sure backend is running on localhost:3000"
- Console shows "Chat response received: {}" (empty object)
- Extension appears to be working but chat fails

**Root Cause:**
The extension is running **cached/old code** that has background script chat handling, but the current code has chat handling in the content script. This creates a mismatch where:
- Background script receives proper responses from backend ✅
- Content script gets empty objects ❌
- Message passing between background and content scripts fails ❌

**Solution:**
1. **Complete Extension Reload:**
   ```bash
   # Go to chrome://extensions/
   # Remove the extension completely
   # Click "Load unpacked"
   # Select the extension folder
   # Enable the extension
   ```

2. **Clear Browser Cache:**
   - Refresh the page (F5)
   - Clear browser cache if needed

3. **Verify Backend is Running:**
   ```bash
   # Check if backend is running
   netstat -an | findstr :3000
   
   # Test backend directly
   curl -X POST http://localhost:3000/chat \
     -H "Content-Type: application/json" \
     -d '{"message":"test","currentUrl":"https://example.com","openaiKey":"test-key"}'
   ```

### Issue 2: Backend Not Starting

**Symptoms:**
- `Error: Cannot find module 'C:\Users\senti\server.js'`
- Backend fails to start
- Port 3000 not listening

**Root Cause:**
Running `node server.js` from wrong directory or PowerShell syntax issues.

**Solution:**
```bash
# Navigate to correct directory
cd "C:\Users\senti\OneDrive\Desktop\Serverless Deployment Plan and MVP Improvement Suggestions\playwright_service"

# Start backend
node server.js

# Verify it's running
netstat -an | findstr :3000
```

### Issue 3: Extension Context Invalidation

**Symptoms:**
- `Uncaught Error: Extension context invalidated`
- Chat stops working after extension reload
- Network errors in console

**Root Cause:**
Extension context becomes invalid when extension is reloaded while page is still using old context.

**Solution:**
1. **Reload extension** (right-click → Reload)
2. **Refresh the page** (F5)
3. **Try chat again**

### Issue 4: CORS Issues

**Symptoms:**
- "Failed to fetch. Backend may be down or CORS issue"
- Network errors in console
- Backend running but extension can't connect

**Root Cause:**
CORS configuration issues or network blocking.

**Solution:**
1. **Check CORS configuration in server.js:**
   ```javascript
   app.use(cors({
       origin: function (origin, callback) {
           if (!origin) return callback(null, true);
           if (origin.startsWith('chrome-extension://')) return callback(null, true);
           if (origin.startsWith('http://localhost:')) return callback(null, true);
           if (origin.startsWith('https://')) return callback(null, true);
           callback(null, true);
       },
       credentials: true,
       methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
       allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
   }));
   ```

2. **Restart backend** after CORS changes

### Issue 5: API Key Not Working

**Symptoms:**
- "OpenAI API key not configured" message
- Chat responses are generic instead of AI-powered
- API key appears to be set but not working

**Root Cause:**
API key not properly saved or retrieved by extension.

**Solution:**
1. **Set API key in extension options:**
   - Click extension icon → Options
   - Enter OpenAI API key
   - Click "Save Settings"

2. **Verify key is saved:**
   - Check console for "API Key from storage: Set"
   - Reload extension if needed

## 🔧 Debugging Steps

### Step 1: Check Backend Status
```bash
# Check if backend is running
netstat -an | findstr :3000

# Test backend directly
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test","currentUrl":"https://example.com","openaiKey":"test-key"}'
```

### Step 2: Check Extension Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for:
   - `✅ ENABLED Tooltip Companion is active!`
   - `Backend Service URL: http://localhost:3000`
   - `API Key from storage: Set`
   - Any error messages

### Step 3: Check Network Requests
1. Open Developer Tools (F12)
2. Go to Network tab
3. Send a chat message
4. Look for requests to `http://localhost:3000/chat`
5. Check response status and content

### Step 4: Verify Extension Code
1. Check if extension is using current code
2. Look for console logs that match current code
3. If logs don't match, reload extension completely

## 🎯 Quick Fix Checklist

- [ ] Backend is running on port 3000
- [ ] Extension is completely reloaded (not just refreshed)
- [ ] Page is refreshed after extension reload
- [ ] API key is set in extension options
- [ ] Console shows proper initialization logs
- [ ] No extension context invalidation errors
- [ ] CORS is properly configured
- [ ] Network requests are reaching backend

## 📝 Common Error Messages

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Backend service unavailable" | Extension using cached code | Complete extension reload |
| "Extension context invalidated" | Context mismatch | Reload extension + refresh page |
| "Failed to fetch" | CORS or network issue | Check CORS config, restart backend |
| "Cannot find module" | Wrong directory | Navigate to playwright_service folder |
| "API key not configured" | Key not saved | Set key in extension options |

## 🚀 Prevention Tips

1. **Always reload extension completely** when making code changes
2. **Refresh the page** after extension reload
3. **Check console logs** to verify current code is running
4. **Test backend directly** before troubleshooting extension
5. **Keep backend running** during development
6. **Use proper directory** when starting backend

## 📞 Getting Help

If issues persist:
1. Check this troubleshooting guide
2. Verify all steps in Quick Fix Checklist
3. Check console logs for specific error messages
4. Test backend directly with curl/PowerShell
5. Document exact error messages and steps taken
