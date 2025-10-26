# Playwright Tooltip System

A browser extension that displays live screenshot previews when hovering over hyperlinks, powered by a Playwright backend service.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Chrome%20%7C%20Firefox%20%7C%20Edge-lightgrey)

## 📖 Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Installation](#installation)
- [Usage](#usage)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [Development](#development)
- [API](#api)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

- 🎯 **Hover Preview**: Instantly see what's behind any link before clicking
- ⚡ **Smart Caching**: Screenshots cached for 5 minutes for lightning-fast display
- 🚀 **Batch Precrawl**: Pre-cache up to 20 links on the current page
- 🔄 **Dynamic Content**: Automatically detects AJAX-loaded links
- 🎨 **Smooth Animations**: Beautiful tooltips with 60fps animations
- 🌐 **Universal Compatibility**: Works on all modern websites
- 🛡️ **Privacy-First**: All processing happens locally
- ⚙️ **Easy Toggle**: Right-click to enable/disable tooltips anytime
- 📱 **Stable UX**: Advanced anti-flicker system for consistent behavior

## 🖼️ Screenshots

_Tooltip preview shown on hover over GitHub links_

## 🚀 Installation

### Prerequisites

- Node.js 18+ (for backend service)
- A modern browser (Chrome, Firefox, Edge, Brave)

### Step 1: Install Backend Service

The backend service is required for screenshot generation.

```bash
cd playwright_service
npm install
npm start
```

The service will run on `http://localhost:3000`

### Step 2: Install Browser Extension

1. Clone this repository:
   ```bash
   git clone https://github.com/mcpmessenger/tooltip-playwright.git
   cd tooltip-playwright
   ```

2. Load the extension in your browser:
   - **Chrome/Edge**: Open `chrome://extensions`, enable Developer mode, click "Load unpacked", select the extension directory
   - **Firefox**: Open `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", select `manifest.json`
   - **Brave**: Follow Chrome instructions

3. Configure the backend URL:
   - Right-click the extension icon → "Options"
   - Enter: `http://localhost:3000` (or your cloud service URL)
   - Click "Save Settings"

## 📱 Usage

### Basic Usage

1. Navigate to any website
2. Hover over any link for ~0.8 seconds
3. A tooltip appears with a screenshot preview of the destination

### Advanced Features

#### Toggle Tooltips On/Off

- **Right-click** anywhere on a page
- Select "Enable/Disable Playwright Tooltips"
- Works instantly across all tabs

#### Batch Pre-cache Links

Open browser console (F12) and run:

```javascript
await window.spiderPrecrawl()
```

This will pre-cache screenshots for up to 20 links on the current page.

#### Pre-cache Specific Number of Links

```javascript
await window.spiderPrecrawl(10)  // Pre-cache 10 links
```

## 🏗️ Architecture

### Components

```
┌─────────────────────────────────────────┐
│         Browser Extension               │
│  ├── manifest.json                      │
│  ├── content.js (tooltip logic)         │
│  ├── background.js (context menu)       │
│  ├── options.html/js (settings)         │
│  └── icons/                              │
└─────────────────────────────────────────┘
              │
              │ HTTP POST /capture
              ▼
┌─────────────────────────────────────────┐
│      Backend Service (Node.js)          │
│  ├── server.js (Express + Playwright)   │
│  ├── package.json                       │
│  └── Screenshot caching                 │
└─────────────────────────────────────────┘
```

### Data Flow

1. User hovers over link
2. Extension detects hover (0.8s delay for stability)
3. Checks local cache first
4. If not cached, sends POST to `http://localhost:3000/capture`
5. Backend captures screenshot with Playwright
6. Returns screenshot as blob URL
7. Extension displays in tooltip (minimum 1s display time)

## ⚙️ Configuration

### Backend URL

Configure in extension options or via console:

```javascript
chrome.storage.sync.set({ 
    backendUrl: 'http://localhost:3000' 
});
```

### Extension Settings

- **Cache TTL**: 5 minutes (configurable in `content.js`)
- **Hover Delay**: 800ms (prevents accidental triggers)
- **Hide Delay**: 500ms (prevents flickering)
- **Min Display Time**: 1 second (ensures visibility)

## 💻 Development

### Project Structure

```
tooltip-playwright/
├── manifest.json              # Extension configuration
├── content.js                 # Main tooltip implementation
├── background.js              # Context menu handler
├── options.html/js            # Settings page
├── icons/                     # Extension icons
├── playwright_service/        # Backend service
│   ├── server.js              # Express + Playwright server
│   ├── package.json           # Backend dependencies
│   └── README.md              # Backend documentation
├── .gitignore                 # Git ignore rules
└── README.md                  # This file
```

### Building for Production

```bash
# Backend
cd playwright_service
npm install
npm start  # Runs on localhost:3000

# Extension
# No build step required - Chrome stores the files directly
```

### Testing

Test on various websites:
- ✅ GitHub
- ✅ Reddit
- ✅ Hacker News
- ✅ AWS Console
- ✅ Gmail
- ✅ Google Search Results

## 🔌 API

### Backend Endpoint

**POST** `/capture`

Request:
```json
{
  "url": "https://example.com"
}
```

Response:
```json
{
  "screenshot": "data:image/png;base64,..."
}
```

### Health Check

**GET** `/health`

Response:
```json
{
  "status": "healthy",
  "browser": "initialized",
  "cache": {
    "size": 0,
    "entries": []
  }
}
```

### Extension API

#### `window.spiderPrecrawl(maxLinks?)`

Pre-caches screenshots for links on the current page.

```javascript
// Cache 20 links (default)
await window.spiderPrecrawl()

// Cache 10 links
await window.spiderPrecrawl(10)
```

Returns:
```javascript
{
  "cached": 18,
  "total": 20
}
```

## 🐛 Troubleshooting

### Tooltips Not Showing

1. **Check Backend Status**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Check Extension Console**
   - Open DevTools (F12) → Console
   - Look for: `✅ ENABLED Playwright tooltips`
   - Check for errors

3. **Verify Settings**
   - Right-click extension icon → Options
   - Ensure backend URL is correct

### Backend Not Responding

```bash
# Check if service is running
cd playwright_service
npm start

# Should see:
# 🚀 Playwright Tooltip Backend Service
# 📡 Server running on http://localhost:3000
```

### Tooltips Flickering

The extension now includes anti-flicker protection:
- 800ms hover delay
- 500ms hide delay
- 1 second minimum display time
- State tracking prevents rapid show/hide cycles

If still experiencing issues, disable tooltips (right-click → Disable) and re-enable.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Keep files under 1000 lines
- Use modern JavaScript (ES6+)
- Add comments for complex logic
- Test on multiple browsers
- Update README for new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Playwright](https://playwright.dev/)
- Inspired by [HoverPreview](https://github.com/example/hoverpreview)
- Icons: Custom design

## 📞 Support

- **Issues**: [GitHub Issues
- **Discussions**: [GitHub Discussions
- **Email**: support@example.com

## 🌟 Star History

If you find this project useful, please consider giving it a star ⭐

---

**Made with ❤️ by the Playwright Tooltip Team**
