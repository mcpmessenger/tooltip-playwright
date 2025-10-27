# Playwright Tooltip System - Testing Notes

## ✅ Current Status

### Working Features
- ✅ Tooltip appears on hover (0.8s delay)
- ✅ Extension loads and initializes correctly
- ✅ Backend service running on http://localhost:3000
- ✅ IndexedDB persistent caching (stores base64 data)
- ✅ Memory cache for fast access
- ✅ Button detection enhanced
- ✅ Precrawl function available

### Known Issues
- ⚠️ CSP errors on some sites (Wells Fargo, etc.) - This is normal and expected
- ⚠️ Authenticated pages (Gmail, GitHub login) will fail to screenshot - This is expected

## 🧪 Testing Checklist

### Basic Functionality
- [x] Extension loads without errors
- [x] Tooltip appears on hover
- [x] Backend service responds
- [x] Screenshots are cached

### Button Detection
- [ ] Hover over buttons works
- [ ] Buttons inside links work
- [ ] React Router buttons work
- [ ] Vue/Nuxt buttons work

### Precrawl Function
- [ ] Run `await window.spiderPrecrawl(10)` in console
- [ ] Check that links are cached
- [ ] Hover should be instant for cached links

### Website Testing
- [ ] Wikipedia
- [ ] GitHub public repos
- [ ] Twitter/X
- [ ] Reddit
- [ ] Hacker News

## 🐛 Troubleshooting

### Blob URL Errors
**Fixed!** Now stores base64 data in IndexedDB instead of blob URLs.

### CSP Violations
These are expected on sites with strict Content Security Policy. They don't affect the tooltip functionality.

### Authenticated Pages
Pages requiring login won't show previews. This is expected behavior.

## 📝 Notes

Backend is running on PID 19760. Check with:
```bash
curl http://localhost:3000/health
```

Reload extension after code changes:
1. Go to chrome://extensions
2. Click reload icon
3. Refresh the test page

