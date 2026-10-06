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
 * Every demo record is flagged `isDemo: true` and shows an "Example" tag in the UI.
 * Hide all of it with VITE_SHOW_DEMO=false once real neighbours have joined.
 */

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
    n: 7, name: 'Ethan Liu', role: 'Engineering', title: 'Machine learning engineer', neighbourhood: 'Fairview', hue: 225,
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
  avatarUrl: '',
  avatarHue: p.hue,
  isDemo: true,
}));

const pid = (n) => id(n);

// weekday: 0 = Sunday … 6 = Saturday. Demo activities recur weekly so the
// community never looks stale.
export const DEMO_ACTIVITIES = [
  {
    n: 101, host: 14, title: 'Morning run', category: 'Move', location: 'Point Grey Road', weekday: 6, time: '09:00',
    description: 'Easy-paced 5K out and back along the water. No pressure, no watches required. Coffee after for anyone who wants it.',
    interested: [1, 4, 6, 9, 12, 3],
  },
  {
    n: 102, host: 2, title: 'Build together', category: 'Work', location: 'A café on West 4th', weekday: 3, time: '10:00',
    description: 'Bring a side project and work alongside a few other people for the morning. Quiet table, headphones welcome.',
    interested: [8, 13, 11, 1],
  },
  {
    n: 103, host: 4, title: 'Product people dinner', category: 'Eat', location: 'Kitsilano', weekday: 4, time: '19:00',
    description: 'Casual dinner for people who work in or around product. No decks, no pitches. Spot shared with those who say they’re in.',
    interested: [1, 3, 6, 8, 11, 12, 14, 7],
  },
  {
    n: 104, host: 9, title: 'Outdoor bootcamp', category: 'Move', location: 'Kits Beach park', weekday: 0, time: '11:00',
    description: 'A friendly community workout on the grass. Every level welcome. Bring water and something to lie on.',
    interested: [10, 14, 6, 3, 4],
  },
  {
    n: 105, host: 11, title: 'Side project night', category: 'Build', location: 'Kitsilano', weekday: 4, time: '18:30',
    description: 'Bring whatever you’re building, even if it’s a spreadsheet. Five-minute show-and-tell, then heads down.',
    interested: [2, 5, 7, 8, 12, 13, 1],
  },
  {
    n: 106, host: 12, title: 'Sunset sea swim', category: 'Move', location: 'Kits Beach', weekday: 2, time: '18:15',
    description: 'A short dip and a long shiver. Wetsuits welcome, bravado optional. We stick close to shore.',
    interested: [10, 5, 3],
  },
  {
    n: 107, host: 3, title: 'Coffee walk along the seawall', category: 'Social', location: 'Kits Point to Vanier Park', weekday: 0, time: '08:30',
    description: 'Grab a coffee, walk the water, talk about whatever. A good one if you’re new around here.',
    interested: [10, 8, 4, 11],
  },
  {
    n: 108, host: 6, title: 'Pacific Spirit trail walk', category: 'Explore', location: 'Pacific Spirit Regional Park', weekday: 6, time: '10:30',
    description: 'About 90 minutes on the forest trails at a chatty pace. We’ll meet at a trailhead off West 16th.',
    interested: [13, 10, 7, 14, 2],
  },
  {
    n: 109, host: 13, title: 'Sunday jam', category: 'Social', location: 'West Point Grey', weekday: 0, time: '15:00',
    description: 'Bring an instrument or don’t. Mostly folk and whatever someone can carry. Snacks provided by whoever remembers.',
    interested: [5, 4, 12],
  },
].map((a) => ({ ...a, id: id(a.n), hostId: pid(a.host), interested: a.interested.map(pid), isDemo: true }));

export const DEMO_ANNOUNCEMENTS = [
  {
    n: 201, author: 14, hoursAgo: 3, category: 'Move', location: 'Point Grey Road', time: '09:00',
    title: 'Anyone up for a run Saturday morning?',
    details: 'Thinking Point Grey Road around 9. Easy pace, coffee after.',
    interested: [9, 1, 6],
  },
  {
    n: 202, author: 11, hoursAgo: 9, category: 'Build', location: '',
    title: 'Looking for a designer',
    details: 'I’m building inventory software for independent bike shops and would love to find someone who wants to explore it with me. Coffee on me while we figure out if it’s a fit.',
    interested: [1, 12],
  },
  {
    n: 203, author: 2, hoursAgo: 20, category: 'Work', location: 'A café on West 4th', time: '10:00',
    title: 'Anyone working from somewhere tomorrow?',
    details: 'Thinking a café on West 4th around 10. Quiet table, headphones optional.',
    interested: [8, 14, 13, 4],
  },
  {
    n: 204, author: 8, hoursAgo: 28, category: 'Build', location: 'Kitsilano',
    title: 'Anyone interested in a side-project night?',
    details: 'A few of us are thinking Thursday evening. Bring whatever you’re building.',
    interested: [2, 7, 11, 5, 13],
  },
  {
    n: 205, author: 10, hoursAgo: 34, category: 'Social', location: 'Kitsilano',
    title: 'New to Kits and would love a walking group',
    details: 'Moved here from Lisbon in August. Free most evenings after 6 and happy to walk anywhere near the water.',
    interested: [3, 8, 12, 6, 4, 14],
  },
  {
    n: 206, author: 12, hoursAgo: 52, category: 'Build', location: '',
    title: 'Looking for 5 people to chat with about finding things to do locally',
    details: 'Twenty minutes over coffee, and I’m buying. It’s for a side project, not a company.',
    interested: [10, 4],
  },
  {
    n: 207, author: 7, hoursAgo: 70, category: 'Eat', location: 'Fairview',
    title: 'Making far too much curry on Sunday',
    details: 'Big pot of chicken curry. Room for four at the table. Bring a dessert, or just yourself.',
    interested: [2, 5, 13, 6],
  },
  {
    n: 208, author: 6, hoursAgo: 96, category: 'Move', location: '',
    title: 'Climbing partner wanted',
    details: 'Bouldering Tuesday and Thursday evenings. Beginner-friendly. I’m not great either.',
    interested: [9, 1],
  },
  {
    n: 209, author: 3, hoursAgo: 120, category: 'Build', location: 'Kitsilano',
    title: 'Happy to give feedback on your pitch',
    details: 'Second-time founder. Thirty minutes on a coffee walk, no strings. Especially keen to help anyone doing consumer health.',
    interested: [11, 4, 8],
  },
  {
    n: 210, author: 13, hoursAgo: 150, category: 'Social', location: 'West Point Grey',
    title: 'Looking for a drummer, any level',
    details: 'Very casual Sunday afternoon jams. We play loudly and not especially well.',
    interested: [5],
  },
].map((a) => ({ ...a, id: id(a.n), authorId: pid(a.author), interested: a.interested.map(pid), isDemo: true }));

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
