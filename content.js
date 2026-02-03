// Content script for parsing Claude usage page

function parseUsage() {
  if (!window.location.href.includes('claude.ai/settings/usage')) {
    return null;
  }

  const paragraphs = document.querySelectorAll('p');
  const percentRegex = /(\d+)% used/;

  for (const p of paragraphs) {
    const match = p.textContent.match(percentRegex);
    if (match) {
      return {
        loggedIn: true,
        percent: parseInt(match[1], 10)
      };
    }
  }

  return { loggedIn: false, percent: 0 };
}

// Wait for page to load, then parse and send
window.addEventListener('load', () => {
  // 2 second delay for React to render
  setTimeout(() => {
    const data = parseUsage();
    if (data && data.loggedIn) {
      chrome.runtime.sendMessage({
        type: 'USAGE_DATA',
        data: data
      });
    }
  }, 2000);
});
