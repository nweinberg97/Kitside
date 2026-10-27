# Kitside

**A small community for people building things in Kits.**

Kitside is an invite-only community for founders, builders and creatives who live in and around Kitsilano, Vancouver. It's built around one weekly session: work side by side, then stay for dinner if enough people want to. The app is the quiet layer around that table: who's coming, what people are working on, who could use a hand, and one short note on Sunday.

> Kitside is an independent community. Places members list are their own picks and aren't affiliated with or endorsed by Kitside unless stated.

---

## Principles

- **The table comes first, the app second.** Every feature should end in people meeting in person.
- **Quiet by design.** No feed, no likes, no followers, no DMs, no streaks. The Sunday note is the only notification.
- **Invite-only.** Everyone was brought in by someone already in, and profiles show who.
- **Updates, not stories.** One line each, with hard character limits.
- **Neighbourhood, never address.**

## What's in the app

| Area | What it does |
| --- | --- |
| **This week** (members' home) | The weekly session with "I'm in" and a separate **Staying for dinner** toggle. Dinner is on once the host's minimum say yes (3 by default), and the card shows how many more are needed. Below: what people are working on, who needs help, other events this week, the latest takeaway and newest spot. |
| **Updates** | Two kinds of one-liners: **Working on** (90 characters; a new one replaces your last) and **Needs help** (120 characters). Others tap **I can help**; you mark an ask **Sorted**. Updates drop off after a week. Your history stays on your profile. |
| **People** | Everyone in Kitside, with **Host** / **Organizer** badges and **Invited by**. No filters, since the group is small. |
| **Profiles** | What someone's working on (a running log), open asks, events they're hosting, and **Get in touch**: email by default, plus LinkedIn and Instagram if they add them. There are no in-app messages. |
| **Our Spots** | Places members actually go: name, area, one line on why it's good, tags (Coffee, Laptop-friendly, Dinner, Groups…), and **I go here**. Later, the list becomes the pitch for table deals with those venues. |
| **Takeaways** | A useful insight, saved when one comes up. Never a required write-up. |
| **Hosts** | Only hosts create events. The organizer makes people hosts from the "…" menu on their profile. |
| **Invites** | From **My profile**: members get 2 invite links, hosts 5, the organizer unlimited. Each link carries a one-time code. |
| **Sunday note** | `#/note` shows exactly what goes out: this week's events, each person's latest working-on line, open asks, new spots and takeaways. One line each, empty sections left out. The organizer can **Copy as email**, or send it automatically (below). |
| **Landing page** | For visitors: real photos and video from Kits, how the week works, an example Sunday note, and **I have an invite**. |
| **Demo** | **See how it works** opens a sandbox with a made-up community in the visitor's browser (invite code `KITS-DEMO`). The real database is never touched. |

## Architecture

- **Frontend:** React 19 + Vite, plain JSX and CSS, and a ~50-line hash router (`src/lib/router.jsx`) so it runs on any static host.
- **Backend:** [Supabase](https://supabase.com) (Postgres, Auth, row-level security). No custom server.
- **Hosting:** GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`).
- **Modes:** live (Supabase), demo (sandbox in the browser), and preview (no Supabase configured, for local development; open `#/?view=landing` to see the landing page).

```
src/
  lib/
    api.js               the one data API the UI uses; picks a backend
    backend/supabase.js  live backend
    backend/local.js     demo / preview backend (localStorage), mirrors the database rules
    week.js              "this week", latest-per-person, the Sunday note builder
    seed.js              the fictional demo community
  components/weekly.jsx  session card, one-line composer, lists, host dialog, contact row
  pages/                 Landing, Week, Updates, People, Person, Spots, Takeaways, Note, Join, Welcome, MyProfile
public/img/              landing photos and the waves clip (location data stripped)
supabase/
  migrations/20261006000000_kitside_init.sql     tables, RLS, grants
  migrations/20261027000000_kitside_weekly.sql   invites, hosts, updates, spots, takeaways, dinner RSVPs
  functions/weekly-note/index.ts                 sends the Sunday note
  seed.sql                                       optional demo rows (generated)
```

### Data model

| Table | Purpose |
| --- | --- |
| `profiles` | One per member. Adds `is_host`, `is_admin` (organizer), `invited_by`, `contact_email`, `instagram`, `weekly_note`. |
| `invites` | One-time codes. Created and redeemed only through database functions. |
| `activities` | Events. `is_session` marks the weekly session; `dinner_place`, `dinner_time` and `dinner_min` set up the optional dinner. |
| `activity_interests` | Who's in, plus `dinner` for who's staying. |
| `updates`, `update_helpers` | Working-on and needs-help lines, and who can help. |
| `spots`, `spot_regulars` | Our Spots, and who goes there. |
| `takeaways` | Saved insights. |
| `blocks`, `reports` | Trust and safety, unchanged. |

### Security (row-level security)

- Only members (people with a profile) can see profiles, events, updates, spots and takeaways. Visitors see the landing page.
- Creating a profile needs a redeemed invite. The exception is the very first person, who becomes the **organizer** (admin and host).
- Members can't make themselves hosts or organizers, or change who invited them. A database trigger resets those fields, and only the organizer can change hosts.
- Only hosts can create events. You can only change or delete your own things, and the organizer can also remove spots and takeaways.
- Edits made in the Supabase SQL Editor are not blocked, so you can always fix things by hand.
- The browser only holds the Supabase URL and the **publishable** key.

These rules were tested against Postgres 16, including running the migrations twice, invite limits, host-only events and members-only reading.

## Launch it

### 1. Database (once)

In Supabase → **SQL Editor → New query**, run these in order:

1. `supabase/migrations/20261006000000_kitside_init.sql`
2. `supabase/migrations/20261027000000_kitside_weekly.sql`

Both are non-destructive: they never drop or delete anything, they run as one transaction, and they're safe to re-run. The second one tightens four existing access rules in place, for members-only reading, invite-required joining and hosts-only events.

`supabase/seed.sql` is optional. You don't need it, and the live site hides those rows anyway.

### 2. Become the organizer

Open the live site, press **I have an invite**, and sign up. Before anyone has joined, no code is needed. The first profile becomes the organizer. Then go to **My profile → Invites** and make links for your first people.

### 3. Auth settings

In **Authentication → URL Configuration**, set the Site URL to `https://nweinberg97.github.io/Kitside/` and add it, plus `http://localhost:5173/`, to Redirect URLs. Supabase's built-in email is rate-limited, so for a launch either turn off **Confirm email** or add your own SMTP (Resend, Postmark).

### 4. GitHub Pages

Repo **Settings → Pages → Source: GitHub Actions**. Every push to `main` deploys.

### 5. (Optional) Send the Sunday note automatically

Until you set this up, open `#/note`, press **Copy as email**, and send it yourself.

1. Make a free [Resend](https://resend.com) account and verify a sending domain.
2. In Supabase → **Edge Functions → Secrets**, add these yourself. Never paste them in chat or commit them:
   - `RESEND_API_KEY`
   - `NOTE_FROM`, e.g. `Kitside <note@yourdomain.com>`
   - `NOTE_SECRET`, any long random string
   - `SITE_URL`, set to `https://nweinberg97.github.io/Kitside/`
3. Deploy the function: `supabase functions deploy weekly-note --project-ref akojekqdkcncsrckbtdh`.
4. Try it without sending anything: call it with header `x-kitside-secret: <NOTE_SECRET>` and body `{"dryRun": true}`.
5. Schedule it with Supabase **Integrations → Cron**: Sundays at 9:00 Vancouver time (`0 16 * * 0` in UTC; use `0 17 * * 0` in winter). Use an HTTP request to the function URL with the `x-kitside-secret` header.

## Run it locally

```bash
npm install
npm run dev          # http://localhost:5173  (preview mode; #/?view=landing for the landing page)
```

Copy `.env.example` to `.env.local` to develop against Supabase. `npm run seed:sql` regenerates `supabase/seed.sql` after you edit `src/lib/seed.js`.

| Variable | Meaning |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL. Empty means preview mode |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable key. Public by design |
| `VITE_AUTH_PROVIDERS` | OAuth providers you've switched on: `google`, `apple`, `linkedin_oidc` |
| `VITE_SHOW_DEMO` | `true` also shows demo rows stored in the database. The demo button works either way |

## Later

- Double-opt-in intros ("I'd like to meet Paige")
- Hosts nominating hosts, with the organizer approving
- Table deals with the most-used spots
- Session notes from deep dives, as Takeaways grow
- One neighbouring area at a time, only once the core group keeps showing up
