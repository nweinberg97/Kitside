/*
 * The weekly rhythm: what counts as "this week", and the Sunday note.
 * The same rules are used by supabase/functions/weekly-note (keep them in sync).
 */
import { firstName, timeLabel } from './format.js';

const DAY = 24 * 3600e3;

/** Events from now through the next 7 days. */
export const inNextWeek = (iso, now = Date.now()) => {
  const t = new Date(iso).getTime();
  return t >= now - 2 * 3600e3 && t < now + 7 * DAY;
};

export function weekLabel(now = new Date()) {
  const end = new Date(now.getTime() + 6 * DAY);
  const f = (d, withMonth) => d.toLocaleDateString('en-CA', withMonth ? { month: 'short', day: 'numeric' } : { day: 'numeric' });
  const sameMonth = now.getMonth() === end.getMonth();
  return `${f(now, true)} – ${f(end, !sameMonth)}`;
}

/** Monday of this week, for the note's title: "Week of Oct 26". */
export function weekOf(now = new Date()) {
  const d = new Date(now);
  const back = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - back);
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

/** Each person's newest "working on" line. Older ones live on their profile. */
export function latestWorkingOn(updates) {
  const seen = new Set();
  return updates
    .filter((u) => u.kind === 'working_on')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .filter((u) => (seen.has(u.authorId) ? false : (seen.add(u.authorId), true)));
}

export const openAsks = (updates) =>
  updates.filter((u) => u.kind === 'ask' && !u.resolved).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

export const dinnerIsOn = (a) => a.dinnerIds.length >= (a.dinnerMin || 3);

const shortDay = (d) => d.toLocaleDateString('en-CA', { weekday: 'short' });

function eventLine(a) {
  const d = new Date(a.startsAt);
  let line = `${a.title}: ${shortDay(d)} ${timeLabel(d)}, ${a.location}`;
  if (a.isSession && a.dinnerPlace) {
    line += ` · dinner ${a.dinnerTime ? `${timeLabel(new Date(`2000-01-01T${a.dinnerTime}`))} ` : ''}at ${a.dinnerPlace} (${a.dinnerIds.length} in)`;
  }
  if (!a.isSession && a.host) line += ` · hosted by ${firstName(a.host.name)}`;
  return line;
}

/**
 * The Sunday note: one line per item, empty sections left out.
 * Returns sections for display and plain text for email.
 */
export function buildNote({ activities = [], updates = [], spots = [], takeaways = [], now = new Date() }) {
  const since = now.getTime() - 7 * DAY;
  const fresh = (x) => new Date(x.createdAt).getTime() >= since;

  const sections = [
    {
      key: 'events', title: 'This week',
      items: activities.filter((a) => inNextWeek(a.startsAt, now.getTime()))
        .sort((a, b) => (b.isSession - a.isSession) || new Date(a.startsAt) - new Date(b.startsAt))
        .map((a) => ({ id: a.id, text: eventLine(a) })),
    },
    {
      key: 'working', title: 'Working on',
      items: latestWorkingOn(updates.filter(fresh)).map((u) => ({ id: u.id, who: u.author, text: u.body })),
    },
    {
      key: 'asks', title: 'Needs help',
      items: openAsks(updates.filter(fresh)).map((u) => ({ id: u.id, who: u.author, text: u.body })),
    },
    {
      key: 'spots', title: 'New spot',
      items: spots.filter(fresh).map((s) => ({ id: s.id, who: s.addedByProfile, text: `${s.name}${s.note ? `: ${s.note}` : ''}`, by: true })),
    },
    {
      key: 'takeaways', title: 'Takeaway',
      items: takeaways.filter(fresh).map((t) => ({ id: t.id, who: t.author, text: t.title, by: true })),
    },
  ].filter((s) => s.items.length);

  const line = (it) => {
    if (!it.who) return `• ${it.text}`;
    return it.by ? `• ${it.text} (${firstName(it.who.name)})` : `• ${firstName(it.who.name)}: ${it.text}`;
  };
  const subject = `Kitside · Week of ${weekOf(now)}`;
  const text = [subject, '', ...sections.flatMap((s) => [s.title.toUpperCase(), ...s.items.map(line), ''])].join('\n').trim();
  return { subject, sections, text, line };
}
