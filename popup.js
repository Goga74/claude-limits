// Popup script for displaying usage data

import { clampThreshold } from './lib.js';

const percentValue = document.getElementById('percent-value');
const statusText = document.getElementById('status-text');
const lastUpdated = document.getElementById('last-updated');
const usageDisplay = document.getElementById('usage-display');
const notifyEnabledEl = document.getElementById('notify-enabled');
const notifyThresholdEl = document.getElementById('notify-threshold');

const DEFAULT_NOTIFY_ENABLED = true;
const DEFAULT_NOTIFY_THRESHOLD = 80;

function getUsageClass(percent) {
  if (percent <= 50) return 'usage-green';
  if (percent <= 80) return 'usage-orange';
  return 'usage-red';
}

function formatLastUpdated(timestamp) {
  if (!timestamp) return '';

  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return 'Updated just now';
  if (minutes < 60) return `Updated ${minutes} min ago`;
  if (hours < 24) return `Updated ${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `Updated ${new Date(timestamp).toLocaleDateString()}`;
}

function displayUsage(data) {
  if (!data) {
    percentValue.textContent = '?';
    statusText.textContent = 'No data yet';
    lastUpdated.textContent = 'Waiting for first update...';
    usageDisplay.className = 'usage-display usage-gray';
    return;
  }

  if (data.loggedIn) {
    percentValue.textContent = data.percent;
    statusText.textContent = 'of your limit used';
    lastUpdated.textContent = formatLastUpdated(data.lastUpdated);
    usageDisplay.className = 'usage-display ' + getUsageClass(data.percent);
  } else {
    percentValue.textContent = '?';
    statusText.textContent = 'Not logged in to Claude';
    lastUpdated.textContent = 'Please log in at claude.ai';
    usageDisplay.className = 'usage-display usage-gray';
  }
}

function loadStoredData() {
  chrome.storage.local.get('usageData', (result) => {
    displayUsage(result.usageData);
  });
}

// --- Notification settings ---

function loadSettings() {
  chrome.storage.local.get(['notifyEnabled', 'notifyThreshold'], (result) => {
    const enabled = result.notifyEnabled !== undefined
      ? result.notifyEnabled
      : DEFAULT_NOTIFY_ENABLED;
    const threshold = result.notifyThreshold !== undefined
      ? clampThreshold(result.notifyThreshold)
      : DEFAULT_NOTIFY_THRESHOLD;

    notifyEnabledEl.checked = enabled;
    notifyThresholdEl.value = threshold;
  });
}

notifyEnabledEl.addEventListener('change', () => {
  chrome.storage.local.set({ notifyEnabled: notifyEnabledEl.checked });
});

notifyThresholdEl.addEventListener('change', () => {
  const value = clampThreshold(notifyThresholdEl.value);
  notifyThresholdEl.value = value; // reflect the clamped/normalized value back to the UI
  chrome.storage.local.set({ notifyThreshold: value });
});

// Initialize
loadStoredData();
loadSettings();
