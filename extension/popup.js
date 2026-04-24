// Extension state
let apiUrl = 'https://aegis-backend-production-d87a.up.railway.app';
let apiToken = '';
let pendingImage = null;

// DOM elements
let statusIndicator, messagesContainer, userInput, sendBtn, attachBtn, fileInput;
let imagePreview, previewImg, removeImageBtn;
let settingsBtn, settingsPanel, closeSettingsBtn, saveSettingsBtn;
let apiUrlInput, apiTokenInput;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
  statusIndicator = document.getElementById('status-indicator');
  messagesContainer = document.getElementById('messages');
  userInput = document.getElementById('user-input');
  sendBtn = document.getElementById('send-btn');
  attachBtn = document.getElementById('attach-btn');
  fileInput = document.getElementById('file-input');
  imagePreview = document.getElementById('image-preview');
  previewImg = document.getElementById('preview-img');
  removeImageBtn = document.getElementById('remove-image');
  settingsBtn = document.getElementById('settings-btn');
  settingsPanel = document.getElementById('settings-panel');
  closeSettingsBtn = document.getElementById('close-settings');
  saveSettingsBtn = document.getElementById('save-settings');
  apiUrlInput = document.getElementById('api-url');
  apiTokenInput = document.getElementById('api-token');

  // Load settings from storage
  loadSettings();

  // Check backend status
  checkBackendStatus();

  // Event listeners
  sendBtn.addEventListener('click', handleSend);
  attachBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);
  removeImageBtn.addEventListener('click', clearImage);
  userInput.addEventListener('input', handleInput);
  userInput.addEventListener('keydown', handleKeyDown);
  settingsBtn.addEventListener('click', () => settingsPanel.classList.remove('hidden'));
  closeSettingsBtn.addEventListener('click', () => settingsPanel.classList.add('hidden'));
  saveSettingsBtn.addEventListener('click', saveSettings);

  // Auto-resize textarea
  userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
  });

  // Paste image support
  userInput.addEventListener('paste', handlePaste);
});

// Load settings
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(['apiUrl_prod', 'apiToken']);
    if (result.apiUrl_prod) {
      apiUrl = result.apiUrl_prod;
    }
    apiUrlInput.value = apiUrl; // Ensure UI always displays current URL
    
    if (result.apiToken) {
      apiToken = result.apiToken;
      apiTokenInput.value = apiToken;
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

// Save settings
async function saveSettings() {
  apiUrl = apiUrlInput.value.trim() || 'https://aegis-backend-production-d87a.up.railway.app';
  apiToken = apiTokenInput.value.trim();

  try {
    await chrome.storage.sync.set({ apiUrl_prod: apiUrl, apiToken });
    settingsPanel.classList.add('hidden');
    checkBackendStatus();
    addMessage('assistant', 'Settings saved successfully.');
  } catch (err) {
    addMessage('assistant', 'Failed to save settings.');
  }
}

// Check backend status
async function checkBackendStatus() {
  try {
    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      headers: apiToken ? { 'Authorization': `Bearer ${apiToken}` } : {},
    });

    if (response.ok) {
      statusIndicator.classList.remove('offline');
      statusIndicator.classList.add('online');
    } else {
      statusIndicator.classList.remove('online');
      statusIndicator.classList.add('offline');
    }
  } catch (err) {
    statusIndicator.classList.remove('online');
    statusIndicator.classList.add('offline');
  }
}

// Handle input changes
function handleInput() {
  const hasText = userInput.value.trim().length > 0;
  const hasImage = pendingImage !== null;
  sendBtn.disabled = !hasText && !hasImage;
}

// Handle key press
function handleKeyDown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}

// Handle file selection
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    addMessage('assistant', 'Please select an image file.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    pendingImage = {
      file: file,
      base64: event.target.result,
      name: file.name,
      size: file.size
    };
    
    previewImg.src = event.target.result;
    imagePreview.classList.remove('hidden');
    handleInput();
  };
  reader.readAsDataURL(file);
  fileInput.value = '';
}

// Handle paste
function handlePaste(e) {
  const items = Array.from(e.clipboardData.items);
  const imageItem = items.find(item => item.type.startsWith('image/'));
  
  if (imageItem) {
    const file = imageItem.getAsFile();
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        pendingImage = {
          file: file,
          base64: event.target.result,
          name: file.name || 'pasted-image.png',
          size: file.size
        };
        
        previewImg.src = event.target.result;
        imagePreview.classList.remove('hidden');
        handleInput();
      };
      reader.readAsDataURL(file);
    }
  }
}

// Clear image
function clearImage() {
  pendingImage = null;
  previewImg.src = '';
  imagePreview.classList.add('hidden');
  handleInput();
}

// Handle send
async function handleSend() {
  const text = userInput.value.trim();
  if (!text && !pendingImage) return;

  // Add user message
  const userMsg = document.createElement('div');
  userMsg.className = 'message user';
  
  let content = `
    <div class="message-icon user-icon">U</div>
    <div class="message-content">
  `;

  if (pendingImage) {
    content += `<img src="${pendingImage.base64}" class="message-image" alt="Upload">`;
  }

  if (text) {
    content += `<div class="message-bubble">${escapeHtml(text)}</div>`;
  }

  content += `<div class="message-time">${getCurrentTime()}</div></div>`;
  userMsg.innerHTML = content;
  messagesContainer.appendChild(userMsg);
  scrollToBottom();

  // Clear input
  const sentImage = pendingImage;
  userInput.value = '';
  userInput.style.height = 'auto';
  clearImage();
  sendBtn.disabled = true;

  // Add loading message
  const loadingMsg = addMessage('assistant', 'Analyzing', true);

  // Call API
  try {
    const payload = { content: text || 'Analyze this image' };

    // Include image as base64 if present
    if (sentImage) {
      payload.content = `${payload.content}\n\n[IMAGE_ATTACHMENT: ${sentImage.name}]\n${sentImage.base64}`;
    }

    const response = await fetch(`${apiUrl}/api/scan/core`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Inference-Mode': 'local',
        ...(apiToken ? { 'Authorization': `Bearer ${apiToken}` } : {})
      },
      body: JSON.stringify(payload)
    });

    // Remove loading message
    messagesContainer.removeChild(loadingMsg);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    displayAnalysisResult(data);

  } catch (err) {
    messagesContainer.removeChild(loadingMsg);
    addMessage('assistant', `Error: ${err.message}. Check API settings.`);
  }
}

// Display analysis result
function displayAnalysisResult(data) {
  const riskScore = (data.risk_score * 100).toFixed(0);
  const riskLevel = riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low';
  const riskLabel = riskScore >= 70 ? 'HIGH RISK' : riskScore >= 40 ? 'MEDIUM RISK' : 'LOW RISK';
  const badgeClass = riskScore >= 70 ? 'critical' : riskScore >= 40 ? 'high' : 'low';

  const resultHTML = `
    <div class="analysis-result">
      <div class="risk-score">
        <span class="risk-value ${riskLevel}">${riskScore}%</span>
        <span class="badge ${badgeClass}">${riskLabel}</span>
      </div>
      <div class="analysis-detail">
        <strong>Type:</strong> ${data.is_ai_generated ? 'AI-Generated' : 'Human'}<br>
        <strong>Model:</strong> ${data.detected_model || 'Unknown'}<br>
        <strong>Recommendation:</strong> ${data.recommendation || 'Review'}
      </div>
    </div>
  `;

  const msg = document.createElement('div');
  msg.className = 'message assistant';
  msg.innerHTML = `
    <div class="message-icon assistant-icon">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    </div>
    <div class="message-content">
      ${resultHTML}
      <div class="message-time">${getCurrentTime()}</div>
    </div>
  `;
  messagesContainer.appendChild(msg);
  scrollToBottom();
}

// Add message
function addMessage(role, text, isLoading = false) {
  const msg = document.createElement('div');
  msg.className = `message ${role}`;
  
  const icon = role === 'assistant' 
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
       </svg>`
    : 'U';
  
  const iconClass = role === 'assistant' ? 'assistant-icon' : 'user-icon';
  
  let content = escapeHtml(text);
  if (isLoading) {
    content += '<span class="loading-dots"><span></span><span></span><span></span></span>';
  }
  
  msg.innerHTML = `
    <div class="message-icon ${iconClass}">${icon}</div>
    <div class="message-content">
      <p>${content}</p>
      <div class="message-time">${getCurrentTime()}</div>
    </div>
  `;
  
  messagesContainer.appendChild(msg);
  scrollToBottom();
  return msg;
}

// Utilities
function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function getCurrentTime() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
