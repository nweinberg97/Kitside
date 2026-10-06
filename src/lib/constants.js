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

const FITNESS_WORDS = ['running', 'fitness', 'cycling', 'climbing', 'swimming', 'tennis', 'surfing', 'soccer', 'outdoors'];

// People filters. Each is a predicate over a profile.
export const PEOPLE_FILTERS = [
  { id: 'all', label: 'Everyone', test: () => true },
  { id: 'Founder', label: 'Founders', test: (p) => p.role === 'Founder' },
  { id: 'Product', label: 'Product', test: (p) => p.role === 'Product' },
  { id: 'Design', label: 'Design', test: (p) => p.role === 'Design' },
  { id: 'Engineering', label: 'Engineering', test: (p) => p.role === 'Engineering' },
  { id: 'Marketing', label: 'Marketing', test: (p) => p.role === 'Marketing' },
  { id: 'Creative', label: 'Creative', test: (p) => p.role === 'Creative' },
  { id: 'remote', label: 'Works remotely', test: (p) => p.isRemote },
  { id: 'building', label: 'Building something', test: (p) => !!p.workingOn?.trim() },
  { id: 'collab', label: 'Looking for collaborators', test: (p) => p.lookingFor.includes('Collaborators') },
  { id: 'social', label: 'Up for hanging out', test: (p) => p.lookingFor.some((l) => ['Meet people', 'Friends', 'Events'].includes(l)) },
  {
    id: 'fitness', label: 'Into fitness',
    test: (p) => p.lookingFor.includes('Fitness buddies') || p.interests.some((i) => FITNESS_WORDS.includes(i.toLowerCase())),
  },
];

export const REPORT_REASONS = [
  'Spam or selling',
  'Harassment or hateful content',
  'Fake or impersonating someone',
  'Shares someone’s private information',
  'Something else',
];

export const DISCLAIMER =
  'Kitside is an independent community concept. Featured businesses, venues, classes, routes, activities, and organizations are examples only and are not affiliated with or endorsed by Kitside.';
