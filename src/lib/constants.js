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

/** Event banners: crops of the founder's own Kits photos (public/img/covers). */
export const COVERS = [
  { id: 'sunset', label: 'Sunset on the water' },
  { id: 'shore', label: 'English Bay at dusk' },
  { id: 'park', label: 'Kits Beach park' },
  { id: 'point', label: 'Kits Point lawn' },
  { id: 'waves', label: 'Waves on the rocks' },
  { id: 'sky', label: 'Pink sky' },
];
const CATEGORY_COVER = { Build: 'sunset', Move: 'point', Work: 'shore', Eat: 'park', Explore: 'waves', Social: 'sky' };
export const coverId = (a) => (COVERS.some((c) => c.id === a?.cover) ? a.cover : CATEGORY_COVER[a?.category] || 'sunset');
export const coverUrl = (id) => `${import.meta.env.BASE_URL}img/covers/${id}.jpg`;

const TAG_COVER = { Coffee: 'shore', 'Laptop-friendly': 'shore', Dinner: 'park', Groups: 'park', Drinks: 'sky', Outdoors: 'waves', Fitness: 'point' };
/** A spot's banner: the member's photo link, one of the Kits covers, or one picked from its tags. */
export function spotPhoto(s) {
  if (s?.photo?.startsWith('https://')) return s.photo;
  if (s?.photo?.startsWith('cover:')) return coverUrl(s.photo.slice(6));
  return coverUrl(TAG_COVER[s?.tags?.[0]] || 'sunset');
}

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
