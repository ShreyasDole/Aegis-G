# AEGIS-G Chrome Extension

GPT-like threat scanner interface for Chrome. Upload text and images for AI-powered forensic analysis.

## Features

- **Chat Interface**: GPT-style conversational UI
- **Text Analysis**: Paste or type text for threat detection
- **Image Upload**: Drag, paste, or upload images
- **Real-time Scanning**: Connects to AEGIS-G backend
- **Risk Scoring**: Visual risk assessment with color coding
- **Settings Panel**: Configure API URL and authentication

## Installation

### 1. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `extension` folder from this project
5. Extension icon will appear in toolbar

### 2. Configure Backend

1. Click the AEGIS-G extension icon
2. Click **API Settings** button
3. Set **Backend URL**: `http://localhost:8000` (or your deployed URL)
4. (Optional) Set **Auth Token** if using authentication
5. Click **Save Settings**

### 3. Start Scanning

- Type text or paste content
- Click attachment icon (📎) or paste images
- Press **Send** or hit Enter
- View analysis results with risk score

## Usage

### Text Analysis
```
1. Click extension icon
2. Type: "Check this message for threats..."
3. Press Enter
4. View risk score and analysis
```

### Image Analysis
```
1. Click attachment icon (📎)
2. Select image file
3. Add optional text description
4. Press Send
5. View multimodal analysis
```

### Paste Support
- Text: Ctrl+V / Cmd+V in input box
- Images: Paste directly into input box

## API Endpoints Used

- `GET /health` - Backend status check
- `POST /api/scan/core` - Threat analysis endpoint

## Development

### File Structure
```
extension/
├── manifest.json       # Extension config
├── popup.html          # Main UI
├── popup.js            # Logic & API calls
├── styles.css          # GPT-like styling
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

### Icons (TODO)

Convert `icons/icon128.svg` to PNG format:
- icon16.png (16x16)
- icon48.png (48x48)
- icon128.png (128x128)

**Tools:**
- https://svgtopng.com
- ImageMagick: `convert icon128.svg -resize 128x128 icon128.png`
- Inkscape: Export PNG

## Settings Storage

Settings saved to Chrome sync storage:
- `apiUrl`: Backend endpoint
- `apiToken`: Bearer token (optional)

## Permissions

- `activeTab`: Read current tab (future feature)
- `storage`: Save settings
- `host_permissions`: API access

## Troubleshooting

**Red status dot (offline):**
- Check backend is running
- Verify API URL in settings
- Check CORS configuration

**"Error: API returned 401":**
- Add auth token in settings
- Verify token is valid

**Image not uploading:**
- Check file is image format
- File size < 5MB recommended
- Try different image format

## Future Features

- [ ] Scan highlighted text on any webpage
- [ ] Scan images from right-click context menu
- [ ] History of scanned items
- [ ] Export analysis reports
- [ ] Dark/light theme toggle

## Demo

![Extension Screenshot](screenshot.png)

---

**Built for AEGIS-G Cognitive Defense Grid**
