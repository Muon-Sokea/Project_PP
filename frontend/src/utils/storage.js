/**
 * Load a value from localStorage with a fallback.
 * @param {string} key - localStorage key
 * @param {*} fallback - Default value if key doesn't exist
 * @returns {*} Parsed value or fallback
 */
export function loadLS(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Save a value to localStorage.
 * @param {string} key - localStorage key
 * @param {*} value - Value to store (will be JSON.stringify'd)
 */
export function saveLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
