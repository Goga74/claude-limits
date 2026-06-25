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

// Track tabs the extension itself opened for auto-refresh, so we only auto-close
// those — never a tab the user opened manually (e.g. via "Open Usage Page").
// The service worker can be terminated between opening a tab and receiving its
// USAGE_DATA message, which would empty an in-memory Set, so we ALSO persist to
// chrome.storage.session (cleared on browser restart, never written to disk).
// storage.session is the source of truth; the Set is a fast in-memory mirror.
const AUTO_OPENED_KEY = 'autoOpenedTabIds';
const autoOpenedTabIds = new Set();

function sessionStorageAvailable() {
  return !!(chrome.storage && chrome.storage.session);
}

// Refresh the in-memory mirror from storage.session (the source of truth).
async function loadAutoOpened() {
  if (!sessionStorageAvailable()) return;
  try {
    const result = await chrome.storage.session.get(AUTO_OPENED_KEY);
    const ids = Array.isArray(result[AUTO_OPENED_KEY]) ? result[AUTO_OPENED_KEY] : [];
    autoOpenedTabIds.clear();
    for (const id of ids) autoOpenedTabIds.add(id);
  } catch (e) {
    // storage.session unavailable — keep the in-memory mirror as-is.
  }
}

async function persistAutoOpened() {
  if (!sessionStorageAvailable()) return;
  try {
    await chrome.storage.session.set({ [AUTO_OPENED_KEY]: [...autoOpenedTabIds] });
  } catch (e) {
    // In-memory only.
  }
}

async function markAutoOpened(tabId) {
  if (tabId === undefined || tabId === null) return;
  await loadAutoOpened();
  autoOpenedTabIds.add(tabId);
  await persistAutoOpened();
}

async function isAutoOpened(tabId) {
  if (tabId === undefined || tabId === null) return false;
  await loadAutoOpened();
  return autoOpenedTabIds.has(tabId);
}

async function unmarkAutoOpened(tabId) {
  if (tabId === undefined || tabId === null) return;
  await loadAutoOpened();
  autoOpenedTabIds.delete(tabId);
  await persistAutoOpened();
}

// Close a tab only if the extension auto-opened it; always drop the id afterward.
async function maybeCloseAutoOpenedTab(tabId) {
  if (tabId === undefined || tabId === null) return;
  try {
    if (await isAutoOpened(tabId)) {
      try {
        await chrome.tabs.remove(tabId);
      } catch (e) {
        // Tab might already be closed.
      }
    }
  } finally {
    await unmarkAutoOpened(tabId);
  }
}

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
      // Fast path: a usage tab is already open. It may be the user's own tab, so
      // reload it to refresh data but do NOT mark it auto-opened — it must stay open.
      await chrome.tabs.reload(existingTabs[0].id);
      return;
    }

    // A service worker has no "current window", so chrome.tabs.create() without an
    // explicit windowId throws "No current window". Resolve a real normal window first.
    let windowId;
    try {
      const win = await chrome.windows.getLastFocused({ windowTypes: ['normal'] });
      if (win && win.id !== chrome.windows.WINDOW_ID_NONE) windowId = win.id;
    } catch (e) {
      // No normal window available
    }

    let tab;
    if (windowId !== undefined) {
      // Normal window exists: open the usage page as a background tab inside it.
      tab = await chrome.tabs.create({
        url: 'https://claude.ai/settings/usage',
        active: false,
        windowId
      });
    } else {
      // No normal window open at all: fall back to a minimized popup window.
      // No bounds (width/height/left/top) — they are forbidden with state:'minimized'.
      const win = await chrome.windows.create({
        url: 'https://claude.ai/settings/usage',
        type: 'popup',
        state: 'minimized'
      });
      tab = win.tabs && win.tabs[0];
    }

    // Record the tab we just opened so only it is eligible for auto-close.
    if (tab && tab.id !== undefined) {
      await markAutoOpened(tab.id);
    }

    // Safety timeout: close the created page after 10 seconds even if no data
    // received, but only if it is still marked auto-opened. Removing the lone tab
    // of the fallback popup closes that window too.
    setTimeout(() => {
      if (tab) maybeCloseAutoOpenedTab(tab.id);
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

      // Close the tab as soon as data is received — but ONLY if the extension
      // auto-opened it. A tab the user opened manually must stay open.
      if (sender.tab) {
        maybeCloseAutoOpenedTab(sender.tab.id);
      }
    } else {
      chrome.action.setBadgeText({ text: '?' });
      chrome.action.setBadgeBackgroundColor({ color: COLORS.GRAY });
    }

    sendResponse({ success: true });
  }
  return true;
});

// Drop ids of tabs closed by any means (e.g. the user) so the set never leaks.
chrome.tabs.onRemoved.addListener((tabId) => {
  unmarkAutoOpened(tabId);
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
