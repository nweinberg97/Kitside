// Shared vocabulary for onboarding, filters and forms.

export const ROLES = ['Founder', 'Product', 'Engineering', 'Design', 'Marketing', 'Operations', 'Creative', 'Other'];

export const INTERESTS = [
  'Running', 'Fitness', 'Coffee', 'Startups', 'AI', 'Design', 'Food',
  'Music', 'Outdoors', 'Learning', 'Side projects',
];

export const LOOKING_FOR = [
  'Meet people', 'Collaborators', 'Side projects', 'Coworking',
  'Events', 'Fitness buddies', 'Mentors', 'Friends',
];

export const NEIGHBOURHOODS = [
  'Kitsilano', 'Kits Point', 'West Point Grey', 'Fairview',
  'Arbutus Ridge', 'Dunbar', 'Shaughnessy', 'Elsewhere in Vancouver',
];

// Things-to-do categories. `tone` maps to a CSS colour token.
export const CATEGORIES = [
  { id: 'Build', tone: 'bay', blurb: 'Projects, hack nights, feedback' },
  { id: 'Move', tone: 'kelp', blurb: 'Runs, swims, classes' },
  { id: 'Work', tone: 'slate', blurb: 'Laptop sessions' },
  { id: 'Eat', tone: 'clay', blurb: 'Dinners, brunch, coffee' },
  { id: 'Explore', tone: 'moss', blurb: 'Walks, trails, trips' },
  { id: 'Social', tone: 'sun', blurb: 'Hang out, jam, meet' },
];

export const categoryTone = (id) => CATEGORIES.find((c) => c.id === id)?.tone || 'slate';

/** Character limits that keep the weekly updates one line long. */
export const LIMITS = { working_on: 90, ask: 120 };

/** Invites per person: members 2, hosts 5, the organizer unlimited (null). */
export const inviteCap = (p) => (p?.isAdmin ? null : p?.isHost ? 5 : 2);

export const SPOT_TAGS = ['Coffee', 'Laptop-friendly', 'Dinner', 'Groups', 'Drinks', 'Outdoors', 'Fitness'];

export const REPORT_REASONS = [
  'Spam or selling',
  'Harassment or hateful content',
  'Fake or impersonating someone',
  'Shares someone’s private information',
  'Something else',
];

export const DISCLAIMER =
  'Kitside is an independent community. Places members list are their own picks; none are affiliated with or endorsed by Kitside unless stated.';
