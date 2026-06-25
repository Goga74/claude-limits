// Pure notification/usage logic for 0Tokens.
// No chrome.* references — safe to unit-test under plain Node.

// Map a usage percentage to a color band.
//   percent <= 50      -> 'green'
//   51..80 (inclusive) -> 'orange'
//   > 80               -> 'red'
export function colorForPercent(percent) {
  if (percent <= 50) return 'green';
  if (percent <= 80) return 'orange';
  return 'red';
}

// Normalize arbitrary user input into an integer threshold in [1, 100].
//   non-numeric / NaN -> 80 (default)
//   floats            -> Math.round
//   numeric strings   -> parsed (e.g. "85" -> 85)
//   out of range      -> clamped to [1, 100]
export function clampThreshold(input) {
  const n = Number(input);
  if (input === '' || input === null || input === undefined || Number.isNaN(n)) {
    return 80;
  }
  let value = Math.round(n);
  if (value < 1) value = 1;
  if (value > 100) value = 100;
  return value;
}

// Decide whether to fire a notification for the current reading, and what the
// next persisted "already notified" state should be.
//
// Returns { notify, notified }:
//   - enabled === false                          -> { notify:false, notified:false }
//   - percent <  threshold                       -> { notify:false, notified:false }  (re-arm)
//   - percent >= threshold && !alreadyNotified   -> { notify:true,  notified:true }
//   - percent >= threshold &&  alreadyNotified   -> { notify:false, notified:true }
export function shouldNotify({ percent, threshold, enabled, alreadyNotified }) {
  if (enabled === false) {
    return { notify: false, notified: false };
  }
  if (percent < threshold) {
    return { notify: false, notified: false };
  }
  if (!alreadyNotified) {
    return { notify: true, notified: true };
  }
  return { notify: false, notified: true };
}
