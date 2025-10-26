# Playwright Tooltip Backend Service

Backend service for the Playwright Tooltip System. Captures screenshots of web pages on demand.

## Quick Start

### 1. Install Dependencies

```bash
cd playwright_service
npm install
```

### 2. Start the Service

```bash
npm start
```

The service will start on `http://localhost:3000`

## API Endpoints

### POST /capture

Capture a screenshot of a URL.

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "screenshot": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

### GET /health

Check service health and cache status.

**Response:**
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

### GET /

Get service information.

## Features

- ✅ Screenshot caching (5 minutes TTL)
- ✅ Automatic browser management
- ✅ Error handling and validation
- ✅ CORS enabled for browser extension
- ✅ Graceful shutdown

## Configuration

### Port

Default: `3000`

Change with environment variable:
```bash
PORT=4000 npm start
```

### Cache TTL

Default: 5 minutes

Edit in `server.js`:
```javascript
const CACHE_TTL = 5 * 60 * 1000; // Change this value
```

## Dependencies

- **express**: Web framework
- **playwright**: Browser automation
- **cors**: Cross-origin resource sharing

## Troubleshooting

### Browser Fails to Launch

On Linux, you may need additional dependencies:
```bash
sudo apt-get install libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2
```

### Performance Issues

- Reduce viewport size in `server.js`
- Increase timeout values
- Add more memory to Node.js process

### Memory Leaks

The service automatically cleans up browser contexts after each screenshot. If you experience memory leaks:
- Restart the service periodically
- Check for browser process accumulation
- Monitor with `GET /health` endpoint

## License

MIT

