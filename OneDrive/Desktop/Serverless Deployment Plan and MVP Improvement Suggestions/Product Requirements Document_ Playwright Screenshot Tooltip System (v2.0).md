# Product Requirements Document: Playwright Screenshot Tooltip System (v2.0)

## 📋 Executive Summary

A lightweight, browser-agnostic tooltip system that displays live screenshot previews when hovering over hyperlinks. The system now features a **Browser Extension** for seamless, automatic injection of the frontend script, eliminating the need for manual console pasting.

**Status:** ✅ **WORKING & DEPLOYED** (Backend), 🚀 **NEW FEATURE** (Frontend Extension)
**Last Updated:** October 26, 2025

---

## 🎯 Product Vision

Enable users to preview the destination of any link before clicking, reducing uncertainty and improving browsing efficiency through real-time visual previews, now with a **zero-setup** frontend experience.

---

## ✨ Key Features (Updated)

### 1. **Hover Preview Tooltips** (Unchanged)
- Hover over any `<a href="...">` link
- Beautiful animated tooltip appears after brief delay
- Shows live screenshot of destination URL
- Works on any website

### 2. **Intelligent Caching** (Unchanged)
- Screenshots cached for 5 minutes
- Instant display for cached URLs
- Automatic cache cleanup
- Memory-efficient storage

### 3. **Batch Precrawl** (Unchanged)
- JavaScript function: `await window.spiderPrecrawl()`
- Precaptures up to 20 links on current page
- Background processing
- Progress feedback in console

### 4. **Universal Compatibility** (Improved)
- ✅ Works in **any modern browser** (Chrome, Firefox, Edge, Safari)
- ✅ **No manual console pasting required** (via Browser Extension)
- ✅ No browser extensions required (Original method still supported)
- ✅ Simple configuration via Extension Options page

---

## 🏗️ Architecture (Updated)

### **Two-Component System:**

The architecture remains a two-component system, but the frontend component is now distributed as a Browser Extension.

```
┌─────────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Any Website (Reddit, Gmail, News, etc.)              │  │
│  │                                                        │  │
│  │  1. Browser Extension is installed                    │  │
│  │  2. Script is INJECTED AUTOMATICALLY                  │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────┐    │  │
│  │  │  Injected Content Script (content.js)         │    │  │
│  │  │  - Reads Backend URL from Extension Storage   │    │  │
│  │  │  - Monitors all <a> tags                      │    │  │
│  │  │  - Detects hover events                       │    │  │
│  │  │  - Fetches screenshots from backend           │    │  │
│  │  │  - Displays animated tooltips                 │    │  │
│  │  │  - Manages local cache                        │    │  │
│  │  └──────────────────────────────────────────────┘    │  │
│  │                                                        │  │
│  └────────────────────────────│──────────────────────────┘  │
│                                │                             │
│                                │ HTTP POST /capture          │
│                                │ { "url": "https://..." }    │
│                                ▼                             │
└─────────────────────────────────────────────────────────────┘
                                 │
                                 │
┌────────────────────────────────▼─────────────────────────────┐
│              PLAYWRIGHT SERVICE (localhost:3000 or Cloud)    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Node.js + Express + Playwright                       │   │
│  │  (Backend remains unchanged)                           │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Specifications (Updated)

### **Component 1: Backend Service (REQUIRED)**
- **Status:** Unchanged. Can be run locally or deployed serverlessly (as per v1.0 recommendations).

### **Component 2: Frontend Distribution (NEW)**

**Technology Stack:**
- Browser Extension (Manifest V3)
- Vanilla JavaScript (ES6+)
- `chrome.storage.sync` for configuration persistence

**Key Files:**
- `manifest.json`: Defines extension properties and content script injection.
- `options.html` / `options.js`: Provides a user interface to configure the backend service URL.
- `content.js`: The former `PASTE_INTO_CONSOLE.js` script, adapted to read the backend URL from storage.

**Key Improvement: Backend URL Configuration**
The backend URL is no longer hardcoded. The `content.js` script now reads the URL from the extension's storage, allowing users to easily switch between a local service (`http://localhost:3000`) and a cloud-deployed service (e.g., AWS API Gateway URL).

---

## 🚀 Deployment & Setup (Updated)

### **Frontend Installation (NEW)**

**Step 1: Install Extension**
1.  Download the extension files.
2.  Open your browser's extension management page (`chrome://extensions` or `about:debugging`).
3.  Enable Developer mode.
4.  Click "Load unpacked" and select the extension folder.

**Step 2: Configure Backend URL**
1.  Go to the extension's options page (right-click the extension icon and select "Options").
2.  Enter the URL of your running Playwright service (e.g., `http://localhost:3000`).
3.  Click "Save Settings."

**Step 3: Use in Browser**
1.  Navigate to any website.
2.  The script is automatically injected.
3.  Hover over any link!

### **Backend Installation**
- **Status:** Unchanged from v1.0. The backend service must be running and accessible via the configured URL.

---

## ✅ Conclusion (Updated)

### **What's New:**
✅ **Zero-Setup Frontend:** Manual console pasting is eliminated via a Browser Extension.
✅ **Configurable Backend:** Users can easily switch between local and cloud-deployed services.

### **Deployment Model:**
```
User's Machine:
  ├─ Browser Extension (Automatic Injection)
  └─ Node.js Backend (localhost:3000) [OPTIONAL]
Cloud Service:
  └─ Serverless Backend (AWS Lambda/API Gateway) [OPTIONAL]
```

**This is a production-ready solution** that provides powerful link preview functionality with minimal complexity and now maximum user-friendliness.

---

**Document Version:** 2.0
**Last Updated:** October 26, 2025
**Status:** ✅ Implemented & Working
**Next Steps:** Distribute extension to users, begin cloud deployment of serverless backend.
