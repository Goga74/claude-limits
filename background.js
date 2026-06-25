// Background service worker for automatic updates and notifications
import { shouldNotify, colorForPercent } from './lib.js';

chrome.action.setTitle({ title: "Claude Usage" });

const COLORS = {
  GREEN: '#4CAF50',
  ORANGE: '#FF9800',
  RED: '#F44336',
  GRAY: '#999999'
};

const BAND_COLORS = {
  green: COLORS.GREEN,
  orange: COLORS.ORANGE,
  red: COLORS.RED
};

const DEFAULT_NOTIFY_ENABLED = true;
const DEFAULT_NOTIFY_THRESHOLD = 80;

// Update every 5 minutes
chrome.alarms.create('autoUpdate', { periodInMinutes: 5 });

// Update immediately on extension install/update
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setTitle({ title: "Claude Usage" });
  initializeBadge();
  setTimeout(() => {
    updateUsageData();
  }, 3000);
});

// Handle startup
chrome.runtime.onStartup.addListener(() => {
  chrome.action.setTitle({ title: "Claude Usage" });
  initializeBadge();
});

// Handle alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  chrome.action.setTitle({ title: "Claude Usage" });
  if (alarm.name === 'autoUpdate') {
    updateUsageData();
  }
});

async function updateUsageData() {
  try {
    // Check if there's already an open claude.ai/settings/usage tab
    const existingTabs = await chrome.tabs.query({
      url: 'https://claude.ai/settings/usage*'
    });

    if (existingTabs.length > 0) {
      await chrome.tabs.reload(existingTabs[0].id);
      return;
    }

    // Open usage page in a background tab (invisible to user)
    const tab = await chrome.tabs.create({
      url: 'https://claude.ai/settings/usage',
      active: false
    });

    // Safety timeout: close tab after 10 seconds even if no data received
    setTimeout(async () => {
      try {
        await chrome.tabs.remove(tab.id);
      } catch (e) {
        // Tab might be already closed by onMessage handler
      }
    }, 10000);

  } catch (error) {
    console.error('Error updating usage:', error);
  }
}

// Listen for data from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'USAGE_DATA') {
    const data = message.data;

    if (data.loggedIn) {
      updateBadge(data.percent);

      chrome.storage.local.set({
        usageData: {
          ...data,
          lastUpdated: Date.now()
        }
      });

      checkAndNotify(data.percent);

      // Close the background tab as soon as data is received
      if (sender.tab) {
        try {
          chrome.tabs.remove(sender.tab.id).catch(() => {});
        } catch (e) {
          // Tab might be already closed
        }
      }
    } else {
      chrome.action.setBadgeText({ text: '?' });
      chrome.action.setBadgeBackgroundColor({ color: COLORS.GRAY });
    }

    sendResponse({ success: true });
  }
  return true;
});

function updateBadge(percent) {
  chrome.action.setBadgeText({ text: `${percent}` });
  chrome.action.setBadgeBackgroundColor({ color: BAND_COLORS[colorForPercent(percent)] });
}

async function checkAndNotify(percent) {
  // All state lives in storage — the service worker can be killed between alarms,
  // so an in-memory flag would not survive.
  const {
    notifyEnabled = DEFAULT_NOTIFY_ENABLED,
    notifyThreshold = DEFAULT_NOTIFY_THRESHOLD,
    notifiedAtThreshold = false
  } = await chrome.storage.local.get([
    'notifyEnabled',
    'notifyThreshold',
    'notifiedAtThreshold'
  ]);

  const result = shouldNotify({
    percent,
    threshold: notifyThreshold,
    enabled: notifyEnabled,
    alreadyNotified: notifiedAtThreshold
  });

  if (result.notify) {
    chrome.notifications.create('limitThreshold', {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Claude Usage Alert',
      message: `You've used ${percent}% of your Claude limit`,
      priority: 2
    });
  }

  await chrome.storage.local.set({ notifiedAtThreshold: result.notified });
}

function initializeBadge() {
  chrome.storage.local.get('usageData', (result) => {
    if (result.usageData && result.usageData.loggedIn) {
      updateBadge(result.usageData.percent);
    } else {
      chrome.action.setBadgeText({ text: '?' });
      chrome.action.setBadgeBackgroundColor({ color: COLORS.GRAY });
    }
  });
}
