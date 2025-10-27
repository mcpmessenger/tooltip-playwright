# ⚡ Fast Tooltips Optimization Plan

## 🎯 Goal: Instant Tooltips (<100ms)

**Current:** Still slow (~2-3 seconds)  
**Target:** Instant (<100ms) using aggressive pre-caching  
**Solution:** Pre-crawl + IndexedDB cache + Smart queue

---

## Current Issues

Even with browser pool:
- ⏱️ Page load: ~2 seconds
- 📸 Screenshot: ~1 second  
- 🔄 Total: ~3 seconds per tooltip

**We need to cache aggressively!**

---

## Solution: Aggressive Pre-Crawling

### Strategy
1. **Auto-detect page load** → Find all links
2. **Pre-crawl top 10-20 links** in background
3. **Store in IndexedDB** (already there!)
4. **Serve instantly** from cache on hover

### Implementation Plan

#### 1. Auto-Precrawl on Page Load ✅ (Add this)
```javascript
// In content.js, add after page load
window.addEventListener('load', () => {
    setTimeout(() => {
        autoPrecrawlTopLinks(15); // Cache top 15 links
    }, 2000); // Wait 2 seconds for page to settle
});
```

#### 2. Smart Queue for Backend
```javascript
// In server.js
const requestQueue = new Queue({ concurrency: 3 });
```

#### 3. Prioritize Cache Hits
```javascript
// Check cache BEFORE acquiring browser
if (cacheEntry && isCacheValid(cacheEntry)) {
    return cacheEntry.screenshotUrl; // INSTANT!
}
```

---

## Changes Needed

### File 1: content.js
**Add auto-precrawl on page load**

### File 2: server.js  
**Add request queuing** (Task 1.4)

### Result:
- ⚡ Hover → Check cache → INSTANT! (no server call)
- 🚀 Backend queue → No overload
- 📊 Smart caching → IndexedDB working

---

## Expected Performance

### Before Optimization:
```
Hover → Acquire Browser → Load Page → Screenshot → Show
TIME: ~3 seconds ❌
```

### After Aggressive Pre-Caching:
```
Hover → Check IndexedDB → Found! → Show
TIME: ~50ms ✅ (60x faster!)

Backend: Pre-crawling links in background
Result: User always gets cached results!
```

---

## Implementation Steps

1. **Add auto-precrawl** to content.js
2. **Add request queue** to server.js
3. **Test** → Should be instant!

**Want me to implement this now?** 🚀

