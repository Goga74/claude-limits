// Content script for parsing Claude usage page

const USAGE_URL = 'claude.ai/settings/usage';
const PERCENT_REGEX = /(\d+)%\s*used/;
const MAX_RETRIES = 10;
const RETRY_INTERVAL = 1000; // 1 second between retries

function parseUsage() {
  // Search all text nodes for "X% used" pattern
  const paragraphs = document.querySelectorAll('p, span, div');
  for (const el of paragraphs) {
    const match = el.textContent.match(PERCENT_REGEX);
    if (match) {
      return {
        loggedIn: true,
        percent: parseInt(match[1], 10)
      };
    }
  }
  return null;
}

function sendData(data) {
  try {
    chrome.runtime.sendMessage({
      type: 'USAGE_DATA',
      data: data
    });
  } catch (e) {
    // Extension context may be invalidated
  }
}

function tryParse(retriesLeft) {
  const data = parseUsage();

  if (data) {
    sendData(data);
    return;
  }

  if (retriesLeft > 0) {
    setTimeout(() => tryParse(retriesLeft - 1), RETRY_INTERVAL);
  } else {
    // All retries exhausted — page loaded but no usage data found
    sendData({ loggedIn: false, percent: 0 });
  }
}

// Only run on usage page
if (window.location.href.includes(USAGE_URL)) {

  // Strategy 1: Poll with retries (handles initial load)
  tryParse(MAX_RETRIES);

  // Strategy 2: MutationObserver (handles late React renders)
  const observer = new MutationObserver(() => {
    const data = parseUsage();
    if (data) {
      sendData(data);
      observer.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });

  // Safety: disconnect observer after 15 seconds
  setTimeout(() => observer.disconnect(), 15000);
}
