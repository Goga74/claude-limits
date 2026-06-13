# Privacy Policy — 0Tokens

**Last updated:** 2026-06-09 / Applies to version 1.2.0

**Short version:** 0Tokens runs entirely inside your browser. It does not
collect, store off your device, transmit, sell, or share any personal data.
There are no servers, no analytics, and no third parties involved.

## What the extension does

0Tokens reads a single value — your usage percentage ("X% used") — from the
Claude usage page (`https://claude.ai/settings/usage`) and displays it to you
locally as a badge on the toolbar icon. Its only purpose is to show you your
own usage status. It does not read, modify, copy, or forward the content of
your conversations or any other page.

## Data we collect

None that leaves your device. 0Tokens only reads the usage percentage needed
to display your status, and that processing happens locally in your browser.
The extension does not send any data to the developer or to any third party.
There is no remote server, no account, no tracking, and no telemetry.

## Local storage

The only data stored is your most recent usage **percentage** (an integer) and
a **timestamp** of when it was last read. This is kept locally on your device
using `chrome.storage.local` and is never transmitted. You can clear it at any
time by removing the extension.

## Permissions and why they are used

- `host access to https://claude.ai/*` — to read the "X% used" value from the
  Claude usage page so it can be displayed to you.
- `tabs` — to find and reload your Claude usage tab, or open and then close a
  temporary background window with the usage page, so the badge can be
  refreshed. The extension does not read the contents of unrelated tabs.
- `storage` — to keep the latest usage percentage and timestamp locally on your
  device.
- `alarms` — to schedule an automatic refresh of the usage percentage every 5
  minutes.
- `notifications` — to show a local desktop alert when usage reaches 80%, 90%,
  and 95%.

## Data sharing and sale

0Tokens does not share, sell, rent, or transfer any user data to anyone, for
any purpose.

## Children

0Tokens is a general-purpose developer tool and is not directed at children
under 13.

## Changes to this policy

If this policy changes, the updated version will be posted at this address with
a new "Last updated" date.

## Contact

Questions about this policy can be sent to capra.lanigera@gmail.com.

---

0Tokens browser extension · [github.com/Goga74/claude-limits](https://github.com/Goga74/claude-limits)
This page is served as static content and loads no external resources.
