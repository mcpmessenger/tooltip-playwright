# How to Reload the Extension

## Quick Steps:
1. Go to `chrome://extensions`
2. Find **"Playwright Tooltip System"**
3. Click the **🔄 Reload** button
4. **Refresh any open tab** (Ctrl+R or F5)
5. **Right-click anywhere** on the page - you should see:
   - ✅ Enable/Disable Playwright Tooltips
   - ✅ Precrawl Links (Cache Screenshots)
   - ✅ Refresh Cache (Clear & Reload)

## Verification:
Open browser console (F12) and you should see:
```
🚀 Playwright Tooltip System service worker starting...
✅ Context menu created
```

## Notes:
- Images ARE being cached (backend shows 24 cached entries)
- Backend is running on http://localhost:3000
- Right-click menu will appear after reload
- Make sure to refresh the page after reloading the extension

