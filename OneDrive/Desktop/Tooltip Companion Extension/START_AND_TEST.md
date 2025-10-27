# 🚀 Start and Test the Backend - Simple Instructions

## ✅ The Simplest Way to Test

### Open 2 Terminals

---

## Terminal 1: Start the Server

**Copy and paste these commands:**

```powershell
cd "C:\Users\senti\OneDrive\Desktop\Tooltip Companion Extension\playwright_service"
node server.js
```

**You should see:**
```
🚀 Initializing browser pool with 3 instances...
✅ Browser instance 1/3 created
✅ Browser instance 2/3 created  
✅ Browser instance 3/3 created
✅ Browser pool initialized with 3 instances
```

✅ **Keep this terminal open!**

---

## Terminal 2: Test the Server

**Copy and paste these commands:**

### Test 1: Health Check
```powershell
$response = Invoke-WebRequest -Uri http://localhost:3000/health
$response.Content
```

**Expected output:**
```json
{
  "status": "healthy",
  "pool": {
    "totalInstances": 3,
    "availableInstances": 3,
    "inUseInstances": 0
  }
}
```

### Test 2: Screenshot Capture
```powershell
$body = @{ url = "https://example.com" } | ConvertTo-Json
$response = Invoke-WebRequest -Uri http://localhost:3000/capture -Method POST -ContentType "application/json" -Body $body
Write-Host "✅ Screenshot captured! Size: $($response.Content.Length) bytes"
```

**You should see in Terminal 1:**
```
📥 Browser acquired. Available: 2, In use: 1
📸 Capturing screenshot: https://example.com
✅ Screenshot captured: https://example.com
📤 Browser released. Available: 3, In use: 0
```

---

## That's It! You're Testing! 🎉

---

## Quick Reference

**Terminal 1 (Server):**
```bash
cd playwright_service
node server.js
```

**Terminal 2 (Test):**
```bash
# Health check
Invoke-WebRequest -Uri http://localhost:3000/health

# Screenshot test
$body = @{ url = "https://example.com" } | ConvertTo-Json
Invoke-WebRequest -Uri http://localhost:3000/capture -Method POST -ContentType "application/json" -Body $body
```

---

## What You're Confirming

✅ Browser pool created (3 instances)  
✅ Server running on port 3000  
✅ Health endpoint works  
✅ Screenshot capture works  
✅ Browser acquire/release works  
✅ Fast response time  

---

## If It Doesn't Work

### Check 1: Is the server running?
Look at Terminal 1 - do you see the browser pool initialized?

### Check 2: Port conflict?
```powershell
netstat -ano | findstr :3000
```

If something is using it:
```powershell
taskkill /F /PID [PID_NUMBER]
```

### Check 3: Right directory?
```powershell
cd "C:\Users\senti\OneDrive\Desktop\Tooltip Companion Extension\playwright_service"
dir
```

Should see: `server.js` and `package.json`

---

**Just follow the 2-terminal approach above and you're good to go!** 🚀

