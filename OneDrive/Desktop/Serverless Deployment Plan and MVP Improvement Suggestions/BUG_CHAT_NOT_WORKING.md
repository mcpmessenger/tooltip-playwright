# 🐛 Chat Functionality Not Working - Bug Report

## Issue Summary
The AI chat widget displays but does not return responses when messages are sent. The chat sends messages but gets no reply from the backend.

## Current Status
- ✅ Chat widget displays correctly
- ✅ UI is functional (send button, mic button, resize)
- ✅ Branding is applied (Tooltip Companion logo)
- ✅ Resizable and draggable
- ❌ **No responses from backend**
- ❌ Messages sent but no AI reply

## Steps to Reproduce
1. Reload extension in `chrome://extensions`
2. Go to any website
3. Right-click → "💬 Open AI Chat Widget"
4. Type a message and click Send (or press Enter)
5. Message appears but no response is received

## Expected Behavior
- User types message → Sends to backend → Backend calls OpenAI → Returns AI response → Displays in chat

## Actual Behavior
- User types message → Sends to backend → **No response received**
- Chat shows empty response or error message

## Technical Details

### Code Flow
1. **content.js** → `sendMessage()` function
2. Gets API key from `chrome.storage.sync`
3. Sends message to **background.js** via `chrome.runtime.sendMessage()`
4. **background.js** → `chrome.runtime.onMessage` listener
5. Forwards to `http://localhost:3000/chat`
6. **Backend** → Should call OpenAI and return response

### Error Logs Needed
Check these locations for errors:
1. **Extension Console** (background.js): `chrome://extensions` → Click "service worker" link
2. **Browser Console** (content.js): F12 → Console tab
3. **Backend Terminal**: Look for incoming requests

### Potential Issues
1. **Message handler not registered**: `chrome.runtime.onMessage` in background.js
2. **API key not passed**: Missing from request body
3. **CORS issue**: Backend not accepting requests from extension
4. **Backend not running**: Localhost:3000 not accessible
5. **OpenAI API issue**: API key invalid or rate limited

## Diagnostic Steps

### Step 1: Check Backend
```bash
curl http://localhost:3000/health
```
Should return: `{"status":"healthy","browser":"initialized"}`

### Step 2: Test Chat Endpoint
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test","url":"https://example.com","openaiKey":"YOUR_KEY"}'
```

### Step 3: Check Extension Console
1. Go to `chrome://extensions`
2. Find "Tooltip Companion"
3. Click "service worker" link
4. Look for:
   - "📨 Background received message: chat"
   - "💬 Forwarding chat message to backend..."
   - Any error messages

### Step 4: Check Browser Console
1. F12 → Console tab
2. Look for:
   - "🔑 API Key from storage: Set/Not set"
   - "📨 Chat response: ..."
   - Any error messages

## Fixes Applied (So Far)
- ✅ Added `chrome.runtime.onMessage` listener in background.js
- ✅ Added API key retrieval from chrome.storage.sync
- ✅ Added extensive logging for debugging
- ✅ Fixed message passing structure

## Next Steps
1. **Test with backend directly** using curl
2. **Check console logs** in both locations posted above
3. **Verify API key** is saved in extension options
4. **Test message flow** step by step
5. **Add more logging** if needed to trace the issue

## Impact
- **Severity**: High (Core feature not working)
- **Priority**: P1 (Blocks user from using AI assistant)
- **Workaround**: None currently available

## Related Files
- `content.js` - Lines 1140-1159 (sendMessage function)
- `background.js` - Lines 115-154 (onMessage listener)
- `playwright_service/server.js` - Lines 165-254 (/chat endpoint)

## Test Data
- Backend URL: `http://localhost:3000`
- Chat Endpoint: `POST /chat`
- Required fields: `message`, `url`, `consoleLogs`, `pageInfo`, `openaiKey`

---

**Reported**: $(date)  
**Status**: 🔴 Open - Investigation in progress  
**Assignee**: Developer  
**Linked PR**: Coming soon

