import { http } from './http.js';

/**
 * Get all bookmarked events for the current user.
 */
export async function apiGetBookmarks() {
  try {
    const data = await http('GET', '/bookmarks');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Bookmark an event.
 * @param {number} eventId
 */
export async function apiBookmarkEvent(eventId) {
  return http('POST', `/bookmarks/${eventId}`);
}

/**
 * Remove a bookmark from an event.
 * @param {number} eventId
 */
export async function apiUnbookmarkEvent(eventId) {
  return http('DELETE', `/bookmarks/${eventId}`);
}

/**
 * Check if an event is bookmarked.
 * @param {number} eventId
 * @returns {Promise<boolean>}
 */
export async function apiCheckBookmark(eventId) {
  try {
    const data = await http('GET', `/bookmarks/check/${eventId}`);
    return !!data.bookmarked;
  } catch {
    return false;
  }
}
