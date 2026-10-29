/*
 * DEMO DATA — every person, activity and post in this file is FICTIONAL.
 *
 * They exist so a first-time visitor sees a believable, populated community.
 * Places named here (Point Grey Road, Kits Beach, West 4th…) are public places
 * used as examples only; no business, venue, class or organization is
 * affiliated with or endorsed by Kitside.
 *
 * This file is the single source of truth for demo content:
 *   - preview mode (no Supabase) loads it straight into localStorage
 *   - `npm run seed:sql` turns it into supabase/seed.sql
 *
 * Business names (cafés, restaurants) are made up too. Public places
 * (Kits Beach, Hadden Park, West 4th) are real and used only as examples.
 *
 * Every demo record is flagged `isDemo: true` and shows an "Example" tag in the UI.
 */

// Members who can host events, and who invited whom.
const HOSTS = [2, 3, 12, 14];
const INVITED_BY = { 2: 1, 3: 1, 4: 3, 5: 2, 6: 3, 7: 2, 8: 3, 9: 14, 10: 12, 11: 3, 12: 1, 13: 5, 14: 2 };

// Profile photos: the same Unsplash portraits Jumpin uses (Unsplash License).
const PHOTOS = {
  1: '1745434159123-4908d0b9df94', 2: '1625241152315-4a698f74ceb7', 3: '1758337082707-e3fbd71ed461',
  4: '1500648767791-00dcc994a43e', 5: '1576110598658-096ae24cdb97', 6: '1592275772614-ec71b19e326f',
  7: '1757744705465-ea08b0ddc38a', 8: '1494790108377-be9c29b29330', 9: '1757700314602-d0971e793203',
  10: '1779338192178-e9333695d868', 11: '1507003211169-0a1dd7228f2d', 12: '1580489944761-15a19d654956',
  13: '1581714161666-dade083654ae', 14: '1662850886700-4ec19bd30d11',
};
const UNSPLASH = (id, w = 900, h = 600) => `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=75&auto=format`;
const photo = (n) => (PHOTOS[n] ? `https://images.unsplash.com/photo-${PHOTOS[n]}?w=240&h=240&fit=crop&crop=faces&q=80&auto=format` : '');

const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

export const DEMO_PROFILES = [
  {
    n: 1, name: 'Maya Okafor', role: 'Design', title: 'Product designer', neighbourhood: 'Kitsilano', hue: 18,
    bio: 'Designs for screen readers first and everyone else second. Thursday nights she’s at the pottery wheel, usually losing.',
    workingOn: 'Accessibility tools for small web teams',
    interests: ['Running', 'Ceramics', 'Coffee', 'Design'],
    lookingFor: ['Collaborators', 'Fitness buddies', 'Meet people'], isRemote: true,
  },
  {
    n: 2, name: 'Daniel Reyes', role: 'Engineering', title: 'Software engineer', neighbourhood: 'Kits Point', hue: 200,
    bio: 'Writes Rust for a Berlin company from a desk that faces the water. Bikes to Spanish Banks most mornings before standup.',
    workingOn: 'Open-source tools for climate datasets',
    interests: ['Cycling', 'Cooking', 'Startups', 'Outdoors'],
    lookingFor: ['Side projects', 'Coworking'], isRemote: true,
  },
  {
    n: 3, name: 'Rachel Kim', role: 'Founder', title: 'Founder', neighbourhood: 'Kitsilano', hue: 340,
    bio: 'Second company. Consumer health, a team of four, and strong opinions about sleep. Takes most meetings as walks.',
    workingOn: 'A sleep coaching app',
    interests: ['Tennis', 'Reading', 'Coffee walks'],
    lookingFor: ['Meet people', 'Mentors'], isRemote: false,
  },
  {
    n: 4, name: 'Sam Whitford', role: 'Product', title: 'Product manager', neighbourhood: 'Fairview', hue: 265,
    bio: 'PM on AI tools for teachers. Will talk about your favourite West 4th restaurant for an unreasonable amount of time.',
    workingOn: 'AI tools for classrooms',
    interests: ['Running', 'Music', 'Restaurants', 'AI'],
    lookingFor: ['Meet people', 'Friends', 'Events'], isRemote: true,
  },
  {
    n: 5, name: 'Jon Takahashi', role: 'Creative', title: 'Creative director, independent studio', neighbourhood: 'Kits Point', hue: 32,
    bio: 'Runs a two-person studio out of the garage behind his place. Surfs Tofino when the swell is right and Jericho when it isn’t.',
    workingOn: 'A photo book about the Fraser River',
    interests: ['Photography', 'Surfing', 'Music'],
    lookingFor: ['Collaborators', 'Meet people'], isRemote: false,
  },
  {
    n: 6, name: 'Priya Nair', role: 'Product', title: 'Product manager, AI education', neighbourhood: 'West Point Grey', hue: 150,
    bio: 'Climbs three nights a week and is trying to learn Portuguese before a trip in the spring. Ask her for a trail recommendation.',
    workingOn: 'Adaptive lessons for adult learners',
    interests: ['Running', 'Climbing', 'Learning', 'Outdoors'],
    lookingFor: ['Fitness buddies', 'Mentors', 'Friends'], isRemote: false,
  },
  {
    n: 7, name: 'Ethan Ward', role: 'Engineering', title: 'Machine learning engineer', neighbourhood: 'Fairview', hue: 225,
    bio: 'Works on medical imaging by day. Cooks one ambitious dinner a week and needs people to help eat it.',
    workingOn: 'A tiny app for splitting grocery runs',
    interests: ['Cooking', 'AI', 'Cycling', 'Food'],
    lookingFor: ['Friends', 'Side projects'], isRemote: false,
  },
  {
    n: 8, name: 'Leah Bergström', role: 'Marketing', title: 'Growth marketer, freelance', neighbourhood: 'Kitsilano', hue: 48,
    bio: 'Helps early-stage companies find their first thousand customers. Moved from Stockholm two years ago and is still hunting for a proper cardamom bun.',
    workingOn: 'A newsletter about consumer growth',
    interests: ['Tennis', 'Books', 'Food'],
    lookingFor: ['Meet people', 'Coworking', 'Collaborators'], isRemote: true,
  },
  {
    n: 9, name: 'Marcus Bell', role: 'Operations', title: 'Operations lead', neighbourhood: 'Arbutus Ridge', hue: 5,
    bio: 'Keeps a logistics startup running and coaches U10 soccer on Saturdays. Wants a weekday running crew that doesn’t start at 5 a.m.',
    workingOn: 'Learning to build with no-code tools',
    interests: ['Running', 'Soccer', 'Coffee', 'Fitness'],
    lookingFor: ['Fitness buddies', 'Mentors'], isRemote: false,
  },
  {
    n: 10, name: 'Ana Sousa', role: 'Other', title: 'Physiotherapist', neighbourhood: 'Kitsilano', hue: 300,
    bio: 'Not in tech, just curious about it. Runs a small clinic three days a week and moved here from Lisbon in August.',
    workingOn: '',
    interests: ['Outdoors', 'Swimming', 'Learning'],
    lookingFor: ['Meet people', 'Friends', 'Events'], isRemote: false,
  },
  {
    n: 11, name: 'Tom Hargreaves', role: 'Founder', title: 'Founder, bootstrapped', neighbourhood: 'Dunbar', hue: 120,
    bio: 'Twelve years in enterprise sales, now building software for independent bike shops. Fixes his own bikes, badly.',
    workingOn: 'Inventory software for bike shops',
    interests: ['Cycling', 'Startups', 'Coffee'],
    lookingFor: ['Collaborators', 'Mentors'], isRemote: false,
  },
  {
    n: 12, name: 'Grace Chen', role: 'Design', title: 'UX researcher', neighbourhood: 'Fairview', hue: 185,
    bio: 'Interviews people for a living, so expect follow-up questions. Sea swims at Kits year-round, including January.',
    workingOn: 'A field guide to running user interviews',
    interests: ['Swimming', 'Design', 'Food'],
    lookingFor: ['Side projects', 'Meet people'], isRemote: true,
  },
  {
    n: 13, name: 'Noah Friedman', role: 'Creative', title: 'Composer and audio engineer', neighbourhood: 'West Point Grey', hue: 280,
    bio: 'Scores indie games from a converted laundry room. Looking for people who want to play music on Sunday afternoons.',
    workingOn: 'The soundtrack for a small puzzle game',
    interests: ['Music', 'Outdoors', 'AI'],
    lookingFor: ['Collaborators', 'Friends'], isRemote: true,
  },
  {
    n: 14, name: 'Isla MacLeod', role: 'Engineering', title: 'Engineering manager', neighbourhood: 'Kitsilano', hue: 95,
    bio: 'Manages a team spread over four time zones, which mostly means very early coffee. Training for the spring half marathon.',
    workingOn: 'Nothing on the side right now, and enjoying it',
    interests: ['Running', 'Coffee', 'Learning'],
    lookingFor: ['Coworking', 'Fitness buddies', 'Meet people'], isRemote: true,
  },
].map((p) => ({
  id: id(p.n),
  name: p.name,
  role: p.role,
  title: p.title,
  bio: p.bio,
  neighbourhood: p.neighbourhood,
  interests: p.interests,
  lookingFor: p.lookingFor,
  workingOn: p.workingOn,
  isRemote: p.isRemote,
  linkedinUrl: '',
  instagram: '',
  contactEmail: `${p.name.split(' ')[0].toLowerCase()}@example.com`,
  weeklyNote: true,
  isHost: HOSTS.includes(p.n),
  isAdmin: false,
  invitedBy: p.n === 1 ? null : id(INVITED_BY[p.n] || 1),
  avatarUrl: photo(p.n),
  avatarHue: p.hue,
  isDemo: true,
  createdAt: new Date(Date.now() - (30 - p.n) * 86400e3).toISOString(),
}));

const pid = (n) => id(n);

/** Invite code that works in the demo sandbox. */
export const DEMO_INVITE = 'KITS-DEMO';

// weekday: 0 = Sunday … 6 = Saturday. Demo events recur weekly so the demo never looks stale.
export const DEMO_ACTIVITIES = [
  {
    n: 101, host: 2, title: 'Build & Break Bread', category: 'Build', location: 'Tidewater Café, West 4th', weekday: 3, time: '16:00',
    description: 'Bring whatever you’re working on. Quick round of what everyone’s on, then heads down. Dinner after for whoever’s staying.',
    isSession: true, dinnerPlace: 'Larch Street Kitchen', dinnerTime: '18:30', dinnerMin: 3, cover: 'park',
    interested: [2, 1, 8, 11, 13, 3], dinner: [2, 8, 11],
  },
  {
    n: 102, host: 14, title: 'Saturday run', category: 'Move', location: 'Point Grey Road', weekday: 6, time: '09:00', cover: 'shore',
    description: 'Easy 5K out and back along the water. Coffee after for anyone who wants it.',
    interested: [14, 1, 4, 6, 9, 12],
  },
  {
    n: 103, host: 12, title: 'Sunset sea swim', category: 'Move', location: 'Kits Beach', weekday: 2, time: '18:15', cover: 'waves',
    description: 'A short dip near shore. Wetsuits welcome.',
    interested: [12, 10, 5, 3],
  },
  {
    n: 104, host: 3, title: 'Founder breakfast', category: 'Eat', location: 'West 4th', weekday: 5, time: '08:00', cover: 'point',
    description: 'Eggs and one honest question each about what’s hard right now. Six seats.',
    interested: [3, 11, 8, 2],
  },
].map((a) => ({
  isSession: false, dinnerPlace: '', dinnerTime: null, dinnerMin: 3, cover: '',
  ...a, id: id(a.n), hostId: pid(a.host), interested: a.interested.map(pid), dinner: (a.dinner || []).map(pid), isDemo: true,
}));

// One-line updates. kind: working_on (90 chars max) or ask (120 chars max).
export const DEMO_UPDATES = [
  { n: 201, author: 11, kind: 'working_on', hoursAgo: 5, body: 'First paying bike shop goes live Thursday' },
  { n: 202, author: 1, kind: 'working_on', hoursAgo: 9, body: 'Accessibility checker beta: onboarding the first 10 teams' },
  { n: 203, author: 3, kind: 'working_on', hoursAgo: 20, body: 'Hiring a first engineer for the sleep app' },
  { n: 204, author: 2, kind: 'working_on', hoursAgo: 26, body: 'Rewriting the climate data importer in Rust' },
  { n: 205, author: 8, kind: 'working_on', hoursAgo: 40, body: 'Newsletter #12: pricing pages that actually convert' },
  { n: 206, author: 5, kind: 'working_on', hoursAgo: 52, body: 'Editing the Fraser River photo book, 40 pages in' },
  { n: 207, author: 13, kind: 'working_on', hoursAgo: 70, body: 'Final mix of the puzzle game soundtrack' },
  { n: 211, author: 11, kind: 'ask', hoursAgo: 6, body: 'A designer to look over our onboarding for 30 minutes', helpers: [1, 12] },
  { n: 212, author: 3, kind: 'ask', hoursAgo: 22, body: 'Intros to anyone who’s hired a first engineer in Vancouver', helpers: [2, 14] },
  { n: 213, author: 8, kind: 'ask', hoursAgo: 44, body: 'Two founders to talk pricing with, 20 minutes each', helpers: [11] },
  { n: 214, author: 5, kind: 'ask', hoursAgo: 60, body: 'A printer recommendation for a short photo book run', helpers: [] },
].map((u) => ({ ...u, id: id(u.n), authorId: pid(u.author), helpers: (u.helpers || []).map(pid), isDemo: true }));

export const DEMO_SPOTS = [
  { n: 301, by: 2, photo: UNSPLASH('1764391836704-8053c8a6e209'), name: 'Tidewater Café', area: 'West 4th', note: 'Big tables, good wifi, fine with laptops before 2pm.', tags: ['Coffee', 'Laptop-friendly'], regulars: [2, 1, 8, 13] },
  { n: 302, by: 3, photo: UNSPLASH('1670899460364-ebc917bac09a'), name: 'Larch Street Kitchen', area: 'Kitsilano', note: 'Long tables. Takes groups of eight if you call ahead.', tags: ['Dinner', 'Groups'], regulars: [3, 11, 8] },
  { n: 303, by: 12, photo: 'cover:park', name: 'Kits Beach logs', area: 'Kits Beach', note: 'Sunset hangs by the volleyball courts. Bring a layer.', tags: ['Outdoors', 'Groups'], regulars: [12, 5, 10, 6, 14] },
  { n: 304, by: 8, photo: UNSPLASH('1760982192590-de2b005bb4d5'), name: 'The Arbutus Room', area: 'West Broadway', note: 'Quiet after-dinner drinks, easier to talk on weeknights.', tags: ['Drinks'], regulars: [8, 4] },
  { n: 305, by: 14, photo: UNSPLASH('1545960122-23d7d68938a6'), name: 'Kits Pool', area: 'Kits Beach', note: 'Laps in summer, then coffee across the street.', tags: ['Fitness', 'Outdoors'], regulars: [14, 12] },
].map((s) => ({ ...s, id: id(s.n), addedBy: pid(s.by), regulars: s.regulars.map(pid), isDemo: true }));

export const DEMO_TAKEAWAYS = [
  { n: 401, author: 11, daysAgo: 2, title: 'Put a price on it before you build it', body: 'I pitched the bike-shop tool at $40 a month with nothing but screenshots. Three shops said yes, eleven said no, and the no’s told me exactly which feature to cut.' },
  { n: 402, author: 12, daysAgo: 6, title: 'Ask about last Tuesday, not “would you use this?”', body: 'People are bad at predicting what they’ll do and good at remembering what they did. “Walk me through the last time this happened” gets you real answers.' },
  { n: 403, author: 3, daysAgo: 11, title: 'Hire for the job in six months, not this week', body: 'My first engineer was perfect for the prototype and miserable once we had paying customers. Write down what the role looks like at month six, then interview for that.' },
  { n: 404, author: 8, daysAgo: 15, title: 'Your first hundred customers come from one channel', body: 'Every company I’ve worked with found its first hundred in a single place. Splitting effort across five channels just makes all five look like they don’t work.' },
  { n: 405, author: 2, daysAgo: 23, title: 'Ship the boring version first', body: 'We spent a month on a real-time sync engine. A nightly CSV export would have shown us in a week that nobody needed real-time.' },
].map((t) => ({ ...t, id: id(t.n), authorId: pid(t.author), isDemo: true }));

/** Next occurrence (local time) of a weekday at HH:MM, today included if still ahead. */
export function nextOccurrence(weekday, time, from = new Date()) {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(from);
  d.setHours(h, m, 0, 0);
  let add = (weekday - d.getDay() + 7) % 7;
  if (add === 0 && d < from) add = 7;
  d.setDate(d.getDate() + add);
  return d;
}
