/** Format an ISO date string or date-only string to "Mar 17, 2026" */
export function formatDate(value: string | undefined | null): string {
  if (!value) return '—';
  const d = new Date(String(value));
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format a time value to "9:00 AM".
 * Handles: "09:00" (24h), "9 AM", "9:00 AM", "9AM"
 */
export function formatTime(value: string | undefined | null): string {
  if (!value) return '—';
  const v = String(value).trim();

  // "HH:MM" 24-hour format (from <input type="time">)
  const h24 = v.match(/^(\d{1,2}):(\d{2})$/);
  if (h24) {
    const h = parseInt(h24[1], 10);
    const m = h24[2];
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${m} ${ampm}`;
  }

  // "9AM", "9 AM", "9:00 AM" formats
  const match = v.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (match) {
    const hour = match[1];
    const min = match[2] || '00';
    const ampm = match[3].toUpperCase();
    return `${hour}:${min} ${ampm}`;
  }

  return v;
}

/** Shorten a long ID to last 6 chars prefixed with # e.g. "#A1B2C3" */
export function shortID(id: string | undefined | null): string {
  if (!id) return '—';
  return '#' + String(id).slice(-6).toUpperCase();
}
