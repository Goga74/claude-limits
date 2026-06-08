# Privacy Policy — 0Tokens

**Last updated:** 2026-06-08

**0Tokens** ("the Extension") is a Chrome browser extension that displays your
Claude AI usage limit directly on the browser toolbar badge. This policy
explains what the Extension does and does not do with your data.

## Summary

The Extension does **not** collect, transmit, sell, or share any personal data.
Everything it reads stays **on your own device**.

## What data the Extension accesses

The Extension reads a **single number** from the Claude usage page
(`https://claude.ai/settings/usage`): the usage percentage shown as
"X% used". To do this it:

- Runs a content script on `https://claude.ai/*` pages that looks for the
  "X% used" text and extracts the integer percentage.
- Periodically (every 5 minutes) opens the usage page in a background browser
  window to refresh that number, then closes the window automatically.

The Extension does **not** read your conversations, account details, email,
name, payment information, or any other content from Claude or any other site.

## What data is stored

The only data stored is:

- The most recent usage **percentage** (an integer, e.g. `42`).
- A **timestamp** of when it was last updated.

This is saved using `chrome.storage.local`, which keeps the data **locally in
your browser on your device**. It is never uploaded anywhere.

## What data is transmitted

**None.** The Extension contains no analytics, no tracking, and no external
servers. It does not send your data to the developer or to any third party.
The only website it interacts with is `claude.ai`, which you are already using.

## Permissions and why they are needed

| Permission | Purpose |
|------------|---------|
| `storage` | Save the latest usage percentage locally between sessions. |
| `tabs` | Open/refresh/close the Claude usage page in the background to read the percentage. |
| `alarms` | Schedule the periodic (5-minute) refresh. |
| `notifications` | Show a local desktop alert when usage reaches 80% / 90% / 95%. |
| `host_permissions: https://claude.ai/*` | Read the "X% used" value from the Claude usage page. |

## Third parties

The Extension does not use any third-party services, SDKs, analytics, or
advertising. No data is shared with anyone.

## Children's privacy

The Extension is not directed at children and collects no personal data from
anyone.

## Changes to this policy

If this policy changes, the updated version will be published in the
Extension's repository with a new "Last updated" date.

## Contact

For questions about this policy, contact: **capra.lanigera@gmail.com**

Repository: https://github.com/Goga74/claude-limits
