// Install Context Menu on Extension Load
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "scan-aegis",
        title: "🛡️ Aegis-G: Scan for AI Threat",
        contexts: ["selection"]
    });
});

// Handle Context Menu Click
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "scan-aegis" && info.selectionText) {
        const selectedText = info.selectionText;
        
        // Use standard Notification API to inform user
        chrome.notifications.create('aegis-scan-start', {
            type: 'basic',
            iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAFElEQVR42mM8w8DwHwBBCAcMkwBAAAAABJRU5ErkJggg==', // Transparent 1x1 fallback
            title: 'Aegis-G Command',
            message: 'Scanning text securely offline...',
            priority: 1
        });

        // Fire request to local Air-Gapped backend
        fetch('http://localhost:8000/api/scan/core', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Inference-Mode': 'local'
            },
            body: JSON.stringify({
                content: selectedText,
                source_platform: getPlatformName(tab.url),
                username: "context_menu_extraction" // Could use content scripts to scrape DOM username
            })
        })
        .then(response => {
            if (!response.ok) throw new Error("Backend Offline");
            return response.json();
        })
        .then(data => {
            const isMalicious = data.risk_score > 0.5 || data.is_ai_generated;
            
            chrome.notifications.create(`aegis-scan-complete-${Date.now()}`, {
                type: 'basic',
                iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAFElEQVR42mM8w8DwHwBBCAcMkwBAAAAABJRU5ErkJggg==',
                title: isMalicious ? '🚨 HIGH RISK THREAT' : '✅ Target Clear',
                message: `Origin: ${data.detected_model.toUpperCase()}\nConfidence: ${Math.round(data.confidence * 100)}%`,
                priority: 2
            });
        })
        .catch(err => {
            console.error(err);
            chrome.notifications.create('aegis-scan-error', {
                type: 'basic',
                iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAFElEQVR42mM8w8DwHwBBCAcMkwBAAAAABJRU5ErkJggg==',
                title: 'Aegis-G Execution Failed',
                message: 'Could not connect to the local inference backend.',
                priority: 1
            });
        });
    }
});

function getPlatformName(url) {
    if (!url) return 'web';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    if (url.includes('facebook.com')) return 'facebook';
    if (url.includes('instagram.com')) return 'instagram';
    return 'web';
}
