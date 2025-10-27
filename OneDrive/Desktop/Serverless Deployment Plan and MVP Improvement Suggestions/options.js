const defaultUrl = 'http://localhost:3000';

function saveOptions() {
  const url = document.getElementById('backendUrl').value;
  const openaiKey = document.getElementById('openaiKey').value;
  
  // Use chrome.storage.sync for cross-browser compatibility (Chrome/Firefox)
  const dataToSave = { backendUrl: url || defaultUrl };
  
  // Only save API key if provided
  if (openaiKey && openaiKey.trim()) {
    dataToSave.openaiKey = openaiKey.trim();
  }
  
  chrome.storage.sync.set(dataToSave, () => {
    const status = document.getElementById('status');
    status.textContent = 'Settings saved! ' + (openaiKey ? 'AI features enabled!' : '');
    status.style.color = '#4CAF50';
    setTimeout(() => {
      status.textContent = '';
    }, 3000);
  });
}

function restoreOptions() {
  // Use chrome.storage.sync for cross-browser compatibility (Chrome/Firefox)
  chrome.storage.sync.get({ backendUrl: defaultUrl, openaiKey: '' }, (items) => {
    document.getElementById('backendUrl').value = items.backendUrl;
    if (items.openaiKey) {
      document.getElementById('openaiKey').value = items.openaiKey;
    }
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('saveButton').addEventListener('click', saveOptions);
