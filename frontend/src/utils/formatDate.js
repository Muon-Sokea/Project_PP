/**
 * Format a date string into a readable date.
 * @param {string|Date} d - The date to format
 * @param {'short'|'long'} monthStyle - Month display style
 * @returns {string} Formatted date string
 */
export function fmtDate(d, monthStyle = 'short') {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: monthStyle,
    day: 'numeric',
  });
}

/**
 * Format a date string to a readable time.
 * @param {string|Date} d - The date to extract time from
 * @returns {string} Formatted time string (e.g. "9:00 AM")
 */
export function fmtTime(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '';
  return dt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
