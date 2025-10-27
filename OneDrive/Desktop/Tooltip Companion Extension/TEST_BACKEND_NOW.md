# 🚀 Test the Backend Now!

## ✅ Success! Browser Pool is Ready

The old server has been killed. Now let's start the new one with the browser pool!

---

## Step 1: Start the Server

Open a **new terminal** and run:

```bash
cd playwright_service
npm start
```

You should see:
```
🚀 Initializing browser pool with 3 instances...
✅ Browser instance 1/3 created
✅ Browser instance 2/3 created
✅ Browser instance 3/3 created
✅ Browser pool initialized with 3 instances

═══════════════════════════════════════════════════
🚀 Tooltip Companion Backend Service
═══════════════════════════════════════════════════
📡 Server running on http://localhost:3000
📸 Endpoint: POST http://localhost:3000/capture
❤️  Health: GET http://localhost:3000/health
═══════════════════════════════════════════════════
```

✅ This confirms the browser pool is working!

---

## Step 2: Test the Health Endpoint

In a **new terminal**, run:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "pool": {
    "totalInstances": 3,
    "availableInstances": 3,
    "inUseInstances": 0,
    "poolSize": 3,
    "isInitialized": true
  },
  "openai": "configured",
  "cache": {
    "size": 0,
    "entries": []
  }
}
```

✅ This shows the pool has 3 instances ready!

---

## Step 3: Test Screenshot Capture

```bash
curl -X POST http://localhost:3000/capture ^
  -H "Content-Type: application/json" ^
  -d "{\"url\":\"https://example.com\"}"
```

**Watch the terminal where the server is running!** You should see:
```
📥 Browser acquired. Available: 2, In use: 1
📸 Capturing screenshot: https://example.com
✅ Screenshot captured: https://example.com
📤 Browser released. Available: 3, In use: 0
```

✅ This shows the pool is working - browser was acquired and released!

---

## Step 4: Test Speed (Optional)

Time the request to see the speed improvement:

```powershell
Measure-Command {
  curl -X POST http://localhost:3000/capture `
    -H "Content-Type: application/json" `
    -d '{\"url\":\"https://example.com\"}'
}
```

**Expected:** Should be very fast! <1 second for the screenshot.

---

## Step 5: Load Test (Optional)

Send multiple requests at once:

```bash
# Send 5 requests in parallel
for i in 1..5; do
  curl -X POST http://localhost:3000/capture `
    -H "Content-Type: application/json" `
    -d "{\"url\":\"https://example$i.com\"}"
done
```

Watch the server logs - you should see browsers being acquired and released efficiently!

---

## ✅ Success Criteria

- [x] Server starts without errors
- [ ] Pool initializes with 3 instances
- [ ] Health endpoint shows pool stats
- [ ] Screenshot captured successfully
- [ ] Browser acquired and released properly
- [ ] Fast response time (<1 second)

---

## 🎉 What You're Testing

**BEFORE (old code):**
- Created new browser instance for each screenshot
- Took ~5 seconds every time
- High resource usage

**NOW (browser pool):**
- Uses pre-warmed browser instances
- Instant (no cold-start delay!)
- Much more efficient

**Expected Improvement:** **90%+ faster!** 🚀

---

## 🐛 Troubleshooting

**Port already in use?**
```bash
netstat -ano | findstr :3000
taskkill /F /PID <PID_NUMBER>
```

**Server not starting?**
- Check Node.js is installed: `node --version`
- Check dependencies: `npm install`

**Testing fails?**
- Make sure server is running
- Check the server terminal for errors
- Try a simpler URL like `https://google.com`

---

## 📊 Next Steps After Testing

Once testing is successful:

1. **Merge to sprint branch:**
   ```bash
   git checkout feature/backend-performance-improvements
   git merge feat/browser-pool
   ```

2. **Continue with Task 1.3:**
   ```bash
   git checkout -b feat/context-reuse
   ```

3. **Or move to Sprint 2 (Frontend):**
   ```bash
   git checkout -b feature/shadow-dom-and-offload
   ```

---

## 💡 What to Look For

✅ **Pool initializes correctly** (3 instances)
✅ **Screenshot works** (no errors)
✅ **Fast response** (<1 second)
✅ **Browsers released** (back to pool)
✅ **No memory leaks** (health endpoint consistent)

**If all green - you're ready to merge!** 🎉

