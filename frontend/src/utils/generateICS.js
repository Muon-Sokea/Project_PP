/**
 * generateICS — builds an ICS calendar file and triggers a browser download.
 *
 * @param {Object} event - The event object with date, time, title, location, category, id
 * @returns {boolean} true if the download was triggered, false on error
 */

function pad(n) {
  return String(n).padStart(2, '0');
}

function fmtICS(d) {
  return (
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    'T' +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    '00'
  );
}

/**
 * Parse the event time string (e.g. "9:00 AM - 5:00 PM") into start/end Date objects.
 * Falls back to 9 AM – 5 PM if parsing fails.
 */
function parseEventTimes(base, timeStr) {
  let start = new Date(base);
  let end = new Date(base);
  const m = timeStr.match(
    /(\d+):(\d+)\s*(AM|PM)\s*-\s*(\d+):(\d+)\s*(AM|PM)/i,
  );

  if (m) {
    const sh = (+m[1] % 12) + (/pm/i.test(m[3]) ? 12 : 0);
    const eh = (+m[4] % 12) + (/pm/i.test(m[6]) ? 12 : 0);
    start.setHours(sh, +m[2], 0);
    end.setHours(eh, +m[5], 0);
  } else {
    start.setHours(9, 0, 0);
    end.setHours(17, 0, 0);
  }

  return { start, end };
}

/**
 * Generate and download an ICS file for the given event.
 *
 * @param {Object} event
 * @param {Function} [onError] - optional callback invoked with an error message on failure
 * @returns {boolean} true on success
 */
export function downloadEventICS(event, onError) {
  if (!event) return false;

  const base = new Date(event.date);
  if (isNaN(base.getTime())) {
    onError?.("Couldn't read the event date");
    return false;
  }

  const { start, end } = parseEventTimes(base, event.time || '');

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Planning Center//Events//EN',
    'BEGIN:VEVENT',
    `UID:${event.id || 'evt'}@planningcenter`,
    `DTSTART:${fmtICS(start)}`,
    `DTEND:${fmtICS(end)}`,
    `SUMMARY:${event.title || 'Event'}`,
    `LOCATION:${event.location || ''}`,
    `DESCRIPTION:${(event.category || '') + ' event via Planning Center'}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (event.title || 'event').replace(/[^\w]+/g, '_') + '.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  return true;
}
