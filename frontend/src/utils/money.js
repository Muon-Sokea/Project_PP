/**
 * Format a number as USD currency string.
 * @param {number} n - The amount
 * @returns {string} Formatted currency (e.g. "$1,000")
 */
export function money(n) {
  return '$' + Number(n).toLocaleString();
}
