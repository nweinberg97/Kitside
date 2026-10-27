// Kitside: the Sunday note.
//
// Builds the weekly note (events in the next 7 days, each person's latest
// "working on" line, open asks, new spots, new takeaways) and emails it to every
// member who hasn't turned it off. Same rules as src/lib/week.js.
//
// Secrets (set in Supabase → Edge Functions → Secrets; never in the repo or chat):
//   RESEND_API_KEY  an API key from resend.com (free tier is plenty)
//   NOTE_FROM       the sender, e.g. "Kitside <note@yourdomain.com>" (a domain verified in Resend)
//   NOTE_SECRET     any long random string; the scheduler sends it so nobody else can trigger a send
//   SITE_URL        optional, e.g. https://nweinberg97.github.io/Kitside/
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase automatically.
//
// Dry run (returns the note, sends nothing): POST with body {"dryRun": true}.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const DAY = 24 * 3600e3;
const TZ = 'America/Vancouver';

type Profile = { id: string; name: string; contact_email: string; weekly_note: boolean; is_demo: boolean };

const first = (name = '') => name.trim().split(/\s+/)[0] || 'Someone';
const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleString('en-CA', { timeZone: TZ, ...opts });
const time = (d: Date) => fmt(d, { hour: 'numeric', minute: '2-digit' }).replace('a.m.', 'AM').replace('p.m.', 'PM');
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

Deno.serve(async (req) => {
  if (req.headers.get('x-kitside-secret') !== Deno.env.get('NOTE_SECRET')) {
    return new Response('Not allowed', { status: 401 });
  }
  const { dryRun = false } = await req.json().catch(() => ({}));
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  const now = Date.now();
  const since = new Date(now - 7 * DAY).toISOString();
  const [{ data: profiles }, { data: events }, { data: updates }, { data: spots }, { data: takeaways }] = await Promise.all([
    sb.from('profiles').select('id, name, contact_email, weekly_note, is_demo').eq('is_demo', false),
    sb.from('activities').select('*, activity_interests(profile_id, dinner)').eq('is_demo', false)
      .gte('starts_at', new Date(now).toISOString()).lt('starts_at', new Date(now + 7 * DAY).toISOString()).order('starts_at'),
    sb.from('updates').select('*').eq('is_demo', false).gte('created_at', since).order('created_at', { ascending: false }),
    sb.from('spots').select('*').eq('is_demo', false).gte('created_at', since),
    sb.from('takeaways').select('*').eq('is_demo', false).gte('created_at', since),
  ]);
  const people = new Map<string, Profile>((profiles || []).map((p: Profile) => [p.id, p]));
  const who = (id: string) => first(people.get(id)?.name);

  const eventLines = (events || [])
    .sort((a, b) => Number(b.is_session) - Number(a.is_session))
    .map((a) => {
      const d = new Date(a.starts_at);
      let line = `${a.title}: ${fmt(d, { weekday: 'short' })} ${time(d)}, ${a.location}`;
      if (a.is_session && a.dinner_place) {
        const n = (a.activity_interests || []).filter((i: { dinner: boolean }) => i.dinner).length;
        line += ` · dinner at ${a.dinner_place} (${n} in)`;
      } else if (!a.is_session) line += ` · hosted by ${who(a.host_id)}`;
      return line;
    });
  const seen = new Set<string>();
  const working = (updates || []).filter((u) => u.kind === 'working_on' && !seen.has(u.author_id) && seen.add(u.author_id))
    .map((u) => `${who(u.author_id)}: ${u.body}`);
  const asks = (updates || []).filter((u) => u.kind === 'ask' && !u.resolved).map((u) => `${who(u.author_id)}: ${u.body}`);
  const spotLines = (spots || []).map((s) => `${s.name}${s.note ? `: ${s.note}` : ''} (${who(s.added_by)})`);
  const takeawayLines = (takeaways || []).map((t) => `${t.title} (${who(t.author_id)})`);

  const sections = [
    ['This week', eventLines], ['Working on', working], ['Needs help', asks], ['New spot', spotLines], ['Takeaway', takeawayLines],
  ].filter(([, items]) => (items as string[]).length) as [string, string[]][];

  const monday = new Date(now);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const subject = `Kitside · Week of ${fmt(monday, { month: 'short', day: 'numeric' })}`;
  const site = Deno.env.get('SITE_URL') || '';
  const footer = `You get this because you're in Kitside.${site ? ` Turn it off on your profile: ${site}#/me` : ' Turn it off on your profile.'}`;
  const text = [subject, '', ...sections.flatMap(([t, items]) => [t.toUpperCase(), ...items.map((i) => `• ${i}`), '']), footer].join('\n');
  const html = `<div style="font:15px/1.55 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#17302A;max-width:560px">
<h2 style="font-size:20px;margin:0 0 12px">${esc(subject)}</h2>
${sections.map(([t, items]) => `<p style="margin:16px 0 4px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#6E7F78">${esc(t)}</p>
<ul style="margin:0;padding-left:18px">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`).join('\n')}
<p style="margin-top:24px;font-size:12px;color:#6E7F78">${esc(footer)}</p></div>`;

  if (!sections.length) return Response.json({ sent: 0, reason: 'Quiet week: nothing to send.' });

  // Recipients: members who want the note. Contact email first, else their login email.
  const recipients: string[] = [];
  for (const p of people.values()) {
    if (!p.weekly_note) continue;
    let email = p.contact_email;
    if (!email) email = (await sb.auth.admin.getUserById(p.id)).data.user?.email || '';
    if (email) recipients.push(email);
  }
  if (dryRun) return Response.json({ subject, text, recipients: recipients.length });

  let sent = 0;
  for (const to of recipients) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: Deno.env.get('NOTE_FROM'), to, subject, text, html }),
    });
    if (res.ok) sent++;
    else console.error('send failed', to.replace(/(.).*@/, '$1***@'), await res.text());
  }
  return Response.json({ sent, of: recipients.length });
});
