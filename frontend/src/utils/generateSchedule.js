/**
 * generateDefaultSchedule — builds a default agenda object from an event's
 * date, time, and category.  Returns `{ "Day Label": [...items] }` or null.
 *
 * The schedule adapts to three category families:
 *   • Workshop / Education  → two workshop sessions
 *   • Networking            → panel + networking rounds
 *   • Everything else       → generic featured sessions
 */

export default function generateDefaultSchedule(event) {
  if (!event?.date) return null;
  const base = new Date(event.date);
  if (isNaN(base.getTime())) return null;

  const timeStr = event.time || '';
  let startH = 9, startM = 0;
  const tm = timeStr.match(/(\d+):(\d+)\s*(AM|PM)\s*-\s*(\d+):(\d+)\s*(AM|PM)/i);
  if (tm) {
    startH = (+tm[1] % 12) + (/pm/i.test(tm[3]) ? 12 : 0);
    startM = +tm[2];
  }

  const cat = (event.category || '').toLowerCase();
  const isWorkshop   = cat.includes('workshop') || cat.includes('education');
  const isNetworking = cat.includes('networking');

  /* ── helpers ──────────────────────────────────────────────────────────── */
  function fmt12(h, m) {
    const ap = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
  }
  function addMin(h, m, add) {
    const total = h * 60 + m + add;
    return { h: Math.floor(total / 60) % 24, m: total % 60 };
  }

  const agenda = [];
  let cur = { h: startH, m: startM };

  /* ── Registration & Welcome ───────────────────────────────────────────── */
  agenda.push({
    time: fmt12(cur.h, cur.m),
    title: 'Registration & Welcome',
    sub: 'Check-in, grab your badge, and enjoy refreshments',
    tag: 'Logistics',
  });
  cur = addMin(cur.h, cur.m, 30);

  /* ── Opening Keynote ──────────────────────────────────────────────────── */
  agenda.push({
    time: fmt12(cur.h, cur.m),
    title: 'Opening Keynote',
    sub: isNetworking
      ? 'Meet the organizers and set the tone for the day'
      : 'Welcome address and event overview',
    tag: 'Keynote',
  });
  cur = addMin(cur.h, cur.m, 60);

  /* ── Category-specific sessions ───────────────────────────────────────── */
  if (isWorkshop) {
    agenda.push({
      time: fmt12(cur.h, cur.m), title: 'Workshop Session I',
      sub: 'Hands-on learning with expert facilitators', tag: 'Workshop',
    });
    cur = addMin(cur.h, cur.m, 90);

    agenda.push({
      time: fmt12(cur.h, cur.m), title: 'Lunch Break',
      sub: 'Networking lunch with fellow attendees', tag: 'Break',
    });
    cur = addMin(cur.h, cur.m, 60);

    agenda.push({
      time: fmt12(cur.h, cur.m), title: 'Workshop Session II',
      sub: 'Deep dive into practical applications', tag: 'Workshop',
    });
    cur = addMin(cur.h, cur.m, 90);
  } else if (isNetworking) {
    agenda.push({
      time: fmt12(cur.h, cur.m), title: 'Panel Discussion',
      sub: 'Industry leaders share insights and experiences', tag: 'Panel',
    });
    cur = addMin(cur.h, cur.m, 60);

    agenda.push({
      time: fmt12(cur.h, cur.m), title: 'Lunch & Networking',
      sub: 'Connect with peers over a catered lunch', tag: 'Break',
    });
    cur = addMin(cur.h, cur.m, 60);

    agenda.push({
      time: fmt12(cur.h, cur.m), title: 'Networking Sessions',
      sub: 'Structured networking rounds and breakout groups', tag: 'Networking',
    });
    cur = addMin(cur.h, cur.m, 90);
  } else {
    agenda.push({
      time: fmt12(cur.h, cur.m), title: 'Featured Session',
      sub: 'Industry-leading insights and trends', tag: 'Session',
    });
    cur = addMin(cur.h, cur.m, 60);

    agenda.push({
      time: fmt12(cur.h, cur.m), title: 'Lunch Break',
      sub: 'Enjoy a catered lunch and network with attendees', tag: 'Break',
    });
    cur = addMin(cur.h, cur.m, 60);

    agenda.push({
      time: fmt12(cur.h, cur.m), title: 'Afternoon Session',
      sub: 'Interactive talks and live demos', tag: 'Session',
    });
    cur = addMin(cur.h, cur.m, 90);
  }

  /* ── Closing ──────────────────────────────────────────────────────────── */
  agenda.push({
    time: fmt12(cur.h, cur.m), title: 'Closing Remarks & Wrap-up',
    sub: 'Key takeaways, Q&A, and closing ceremony', tag: 'Closing',
  });

  const dayLabel = base.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  return { [dayLabel]: agenda };
}
