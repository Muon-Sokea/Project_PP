/**
 * Extract initials from a name string.
 * Returns up to 2 uppercase characters.
 * @param {string} name - Full name
 * @returns {string} Initials (e.g. "JD" for "John Doe")
 */
export function initials(name) {
  return name.split(/\s+/).map(w => w.charAt(0)).join('').slice(0, 2).toUpperCase();
}
