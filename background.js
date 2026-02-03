// Background service worker for automatic updates and notifications
chrome.action.setTitle({ title: "Claude Usage" });

const COLORS = {
  GREEN: '#4CAF50',
  ORANGE: '#FF9800',
  RED: '#F44336',
  GRAY: '#999999'
};

let lastNotificationLevel = 0;

// Update every 5 minutes
chrome.alarms.create('autoUpdate', { periodInMinutes: 5 });

// Update immediately on extension install/update
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setTitle({ title: "Claude Usage" });
  initializeBadge();
  // Delay first auto-update to let extension fully initialize
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
    // Open usage page in background
    const tab = await chrome.tabs.create({
      url: 'https://claude.ai/settings/usage',
      active: false
    });

    // Wait 6 seconds for page to load and content script to parse, then close tab
    setTimeout(async () => {
      try {
        await chrome.tabs.remove(tab.id);
      } catch (e) {
        // Tab might be already closed
      }
    }, 6000);

  } catch (error) {
    console.error('Error updating usage:', error);
  }
}

// Listen for data from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'USAGE_DATA') {
    const data = message.data;

    if (data.loggedIn) {
      // Update badge
      updateBadge(data.percent);

      // Save to storage
      chrome.storage.local.set({
        usageData: {
          ...data,
          lastUpdated: Date.now()
        }
      });

      // Check for notifications
      checkAndNotify(data.percent);
    } else {
      // Not logged in
      chrome.action.setBadgeText({ text: '?' });
      chrome.action.setBadgeBackgroundColor({ color: COLORS.GRAY });
    }

    sendResponse({ success: true });
  }
  return true;
});

function updateBadge(percent) {
  chrome.action.setBadgeText({ text: `${percent}` });

  let color = COLORS.GREEN;
  if (percent > 50) color = COLORS.ORANGE;
  if (percent > 80) color = COLORS.RED;

  chrome.action.setBadgeBackgroundColor({ color });
}

function checkAndNotify(percent) {
  // Notify at 80%, 90%, 95%
  const levels = [
    { threshold: 80, id: 'limit80', message: "You've used 80% of your Claude limit" },
    { threshold: 90, id: 'limit90', message: "You've used 90% of your Claude limit" },
    { threshold: 95, id: 'limit95', message: "You've used 95% of your Claude limit!" }
  ];

  for (const level of levels) {
    if (percent >= level.threshold && lastNotificationLevel < level.threshold) {
      chrome.notifications.create(level.id, {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Claude Usage Alert',
        message: level.message,
        priority: 2
      });
      lastNotificationLevel = level.threshold;
      break;
    }
  }

  // Reset notification level if usage dropped (new billing cycle)
  if (percent < 80) {
    lastNotificationLevel = 0;
  }
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
