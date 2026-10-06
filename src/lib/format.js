const DAY = 24 * 3600e3;

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

/** "Today", "Tomorrow", "Saturday", or "Sat, Oct 17" when more than a week out. */
export function dayLabel(date, now = new Date()) {
  const d = new Date(date);
  const diff = Math.round((startOfDay(d) - startOfDay(now)) / DAY);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff > 1 && diff < 7) return d.toLocaleDateString('en-CA', { weekday: 'long' });
  return d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
}

export const timeLabel = (date) =>
  new Date(date).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' }).replace('a.m.', 'AM').replace('p.m.', 'PM');

export function hhmmLabel(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(); d.setHours(h, m, 0, 0);
  return timeLabel(d);
}

export function dateOnlyLabel(ymd) {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  return dayLabel(new Date(y, m - 1, d, 12));
}

export const whenLabel = (date) => `${dayLabel(date)}, ${timeLabel(date)}`;

export function ago(date, now = Date.now()) {
  const s = Math.max(0, (now - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 7) return d === 1 ? 'yesterday' : `${d} days ago`;
  return new Date(date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

export const firstName = (name = '') => name.trim().split(/\s+/)[0] || 'Someone';

export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Local YYYY-MM-DD for <input type="date">. */
export const toYmd = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
