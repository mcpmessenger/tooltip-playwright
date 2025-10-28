const defaultUrl = 'http://localhost:3000';

function saveOptions() {
  const url = document.getElementById('backendUrl').value;
  const openaiKey = document.getElementById('openaiKey').value;
  
  // Use chrome.storage.sync for cross-browser compatibility (Chrome/Firefox)
  chrome.storage.sync.set({ 
    backendUrl: url || defaultUrl,
    openaiKey: openaiKey || ''
  }, () => {
    const status = document.getElementById('status');
    status.textContent = 'Settings saved!';
    setTimeout(() => {
      status.textContent = '';
    }, 750);
  });
}

function restoreOptions() {
  // Use chrome.storage.sync for cross-browser compatibility (Chrome/Firefox)
  chrome.storage.sync.get({ backendUrl: defaultUrl, openaiKey: '' }, (items) => {
    document.getElementById('backendUrl').value = items.backendUrl;
    document.getElementById('openaiKey').value = items.openaiKey || '';
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('saveButton').addEventListener('click', saveOptions);
