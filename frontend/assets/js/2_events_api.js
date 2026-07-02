// ─────────────────────────────────────
// 2_events_api.js — Events loader
// Uses mockEvents from 2_events.js (no backend required)
// ─────────────────────────────────────
import { apiGetEvents } from '/assets/js/Fakedata/api.js';

document.addEventListener("DOMContentLoaded", async function() {
  const grid = document.getElementById("eventsGrid");
  if (!grid) return;

  try {
    const data = await apiGetEvents();
    if (!data || !data.length) {
      console.log('No events data available');
    }
    // events are already rendered by 2_events.js via mockEvents
    // this file is a no-op when mockEvents is present
  } catch (err) {
    console.log('No events data available');
  }
});
