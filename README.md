# Kitside

**Good people, right nearby.**

Kitside is a local community for people in Kitsilano who build, work, create, explore, and want to meet more interesting people nearby. See who's around, find something to do this week, post what you're up to, and say "I'm in."

> Kitside is an independent prototype/community concept. Any businesses, venues, classes, routes, activities, or organizations referenced in the demo are examples only and are not affiliated with, sponsored by, or endorsed by Kitside unless explicitly stated.

---

## Why it exists

**The problem.** Plenty of interesting people live within a few blocks of each other in Kits: founders, engineers, designers, remote workers, creatives, people new to town. There's no lightweight way to find them by what they do, what they're building, or what they'd like to do this weekend. Slack groups are noisy, Meetup is transactional, LinkedIn isn't local, coworking is tied to a building, and Instagram doesn't help you discover the person two streets over.

**The thesis.** There are already interesting people and interesting things happening around Kits. Kitside makes them easier to find. Locality is the wedge: everything is neighbourhood-scale, and nothing ever shows more precise location than a neighbourhood.

**Who it's for.** People living in or around Kitsilano: founders and operators, engineers, product and design people, marketers, researchers, freelancers, remote workers, independent builders, creatives, active people, and anyone who wants a stronger local social life. You don't need to work in tech.

**The loop.** Discover people → discover things to do → say you're in → meet people → post your own plans → the community grows.

## What's in the app

| Area | What you can do |
| --- | --- |
| **Home** | The pitch in ten seconds, an illustrated Kits Beach scene with live pins for neighbours and plans, people and things happening this week |
| **People** | Browse profiles, filter (founders, design, remote, building something, looking for collaborators, into fitness…), open a profile |
| **Things to do** | Upcoming activities grouped by day, filter by Build / Move / Work / Eat / Explore / Social, say "I'm in", start your own |
| **Announcements** | A neighbourhood bulletin board. Post "what do you want to do?" with an optional date, time, place and category; others tap "I'm interested" |
| **Join + onboarding** | Email sign-up (social sign-in where configured), then four quick questions: what you do, what you're into, what you're looking for, what you're working on |
| **My profile** | Edit everything neighbours see, live preview, manage blocked people, log out |
| **Trust & safety** | Report people, posts and activities; block people; delete your own posts; neighbourhood-level location only; no fake verification badges |

## Architecture

Deliberately small:

- **Frontend:** React 19 + Vite, plain JSX and CSS. No UI framework, no state library. A ~50-line hash router (`src/lib/router.jsx`) so the build works on any static host.
- **Backend:** [Supabase](https://supabase.com) free tier: Postgres, Auth and row-level security. No custom server.
- **Hosting:** GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`).
- **Preview mode:** with no Supabase settings, the same app runs entirely in the browser on `localStorage` (`src/lib/backend/local.js`). Handy for local development and design reviews. Nothing is shared between people in this mode, and a banner says so.

```
src/
  main.jsx, App.jsx          entry + page switch
  styles.css                 the whole visual system (tokens at the top)
  lib/
    api.js                   the one data API the UI uses; picks a backend
    backend/supabase.js      live backend (Supabase)
    backend/local.js         preview backend (localStorage)
    seed.js                  the fictional demo community (single source of truth)
    constants.js             roles, interests, categories, filters, disclaimer
    config.js, format.js, router.jsx, useLoad.js
  state/                     session (auth + profile + blocks), toasts, member gate
  components/                KitsScene (hero illustration), cards, buttons, modal, layout
  pages/                     Home, People, Person, Things, Announcements, Join, Welcome, MyProfile
supabase/
  migrations/20261006000000_kitside_init.sql   tables, RLS policies, grants (non-destructive)
  seed.sql                                     demo community (generated, insert-only)
scripts/generate-seed-sql.mjs                  regenerates seed.sql from src/lib/seed.js
```

### Data model

| Table | Purpose |
| --- | --- |
| `profiles` | One per member (`id` = auth user id). Name, role, title, bio, neighbourhood, interests, looking for, working on, remote, optional LinkedIn link. `is_demo` marks fictional examples. |
| `activities` | Things to do: host, title, category, approximate location, start time. |
| `announcements` | Bulletin posts: author, title, optional details/date/time/place/category. `hidden` lets a moderator take a post down. |
| `activity_interests`, `announcement_interests` | Who said "I'm in". Counts are public. |
| `blocks` | Private to the blocker. |
| `reports` | Write-only from the app. Review in the Supabase Table Editor. |

### Security (row-level security)

- People who haven't joined see only the fictional example profiles. Real members' profiles are visible to signed-in members only. Activities and posts by real members show "A neighbour" to visitors.
- You can only create or edit your own profile, and can't mark anything as demo.
- Only hosts can edit or cancel their activities; only authors can delete their posts.
- You can only add or remove your own "I'm in".
- Blocks are visible only to the person who blocked. Reports can't be read through the app at all.
- The browser only ever holds the Supabase URL and **publishable** key. Never put a secret / `service_role` key in this repo.

These rules were tested against Postgres 16 with a stand-in for Supabase's `auth` schema: own-row writes succeed; writing as someone else, faking demo rows, reading reports, and anonymous writes are all refused.

## Launch it

The live site reads its Supabase settings from `.env.production` (already filled in with this project's URL and publishable key; both are public by design).

### 1. Set up the database (once)

In the Supabase dashboard for the project, open **SQL Editor → New query** and run, in order:

1. `supabase/migrations/20261006000000_kitside_init.sql`: creates the tables, policies and grants.
2. `supabase/seed.sql`: adds the fictional example community (optional but recommended at launch).

Both scripts are **non-destructive**: they never drop, delete or overwrite anything, run as a single transaction, and are safe to re-run. If a table with one of Kitside's names already exists with a different shape, the migration stops before changing anything and tells you which table and columns are the problem.

With the Supabase CLI instead: `supabase link --project-ref akojekqdkcncsrckbtdh` then `supabase db push` (you'll enter the database password in your own terminal).

### 2. Configure auth

In **Authentication → URL Configuration**:

- **Site URL:** `https://nweinberg97.github.io/kitside/`
- **Redirect URLs:** add `https://nweinberg97.github.io/kitside/` and `http://localhost:5173/`

In **Authentication → Providers → Email**: Supabase's built-in email sender is limited to a few emails an hour, which is fine for testing but not for a launch. Either turn off **Confirm email** for the first wave of neighbours, or add your own SMTP (Resend, Postmark, etc. all have free tiers) under **Authentication → Emails → SMTP settings**.

### 3. Turn on GitHub Pages

Repo **Settings → Pages → Source: GitHub Actions**. Every push to `main` builds and deploys to `https://nweinberg97.github.io/kitside/`.

### 4. (Optional) Social sign-in

The Google, Apple and LinkedIn buttons are real Supabase OAuth calls, but each one shows "Not set up yet" until you switch it on:

1. Enable the provider in **Authentication → Providers** (Google; Apple; **LinkedIn (OIDC)**), using credentials from that provider's developer console. The callback URL to give them is `https://akojekqdkcncsrckbtdh.supabase.co/auth/v1/callback`.
2. Add it to `VITE_AUTH_PROVIDERS` in `.env.production`, e.g. `VITE_AUTH_PROVIDERS=google,linkedin_oidc`, and push.

LinkedIn sign-in proves someone controls a LinkedIn account; Kitside doesn't show it as a "verified" badge.

### 5. When real people have joined

Set `VITE_SHOW_DEMO=false` in `.env.production` to hide every example profile, activity and post. No database change needed; the demo rows can stay.

## Run it locally

```bash
npm install
npm run dev          # http://localhost:5173
```

Without a `.env.local`, local dev uses preview mode (browser-only data, seeded with the demo community). To develop against Supabase, copy `.env.example` to `.env.local` and fill it in. `npm run build` produces `dist/`.

### Environment variables

| Variable | Meaning |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL. Empty = preview mode |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable (anon) key. Public by design |
| `VITE_AUTH_PROVIDERS` | Comma list of OAuth providers you've enabled: `google`, `apple`, `linkedin_oidc` |
| `VITE_SHOW_DEMO` | `false` hides the fictional example content |

## Demo data

Every example person, activity and post is **fictional** and lives in `src/lib/seed.js`. In the UI they carry an "Example" tag. There are 14 people (a mix of founders, engineers, designers, PMs, creatives, a physio who's just curious), 9 weekly activities and 10 bulletin posts. Example activities repeat weekly (`roll_demo_activities()`), so the schedule never looks stale. Real places mentioned (Point Grey Road, Kits Beach, West 4th, Pacific Spirit) are public places used as examples only.

After editing `seed.js`, run `npm run seed:sql` to regenerate `supabase/seed.sql`.

## Known limitations

- No messaging. You meet people by joining the same plan or replying in person. Deliberate for now.
- No image uploads. Avatars are initials, or the photo from a social sign-in.
- Moderation is manual: reports land in the `reports` table, and you hide a post by setting `hidden = true`.
- Activities can't be edited after posting (cancel and repost).
- Free-tier Supabase pauses projects after a week without traffic; open the dashboard to wake it.
- Email confirmation depends on Supabase's email limits until you add SMTP (see above).

## Future opportunities

- "New this week" digest email for people who opt in
- Lightweight replies on announcements
- Small recurring groups (Saturday runners, Wednesday builders)
- A neighbourhood map view of plans (still approximate, never addresses)
- LinkedIn sign-in as an opt-in trust signal
- Expanding the wedge: West Point Grey, Fairview, Mount Pleasant, one neighbourhood at a time
