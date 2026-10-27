import { useEffect, useRef, useState } from 'react';
import { DemoButton } from '../components/Layout.jsx';
import { MODE } from '../lib/config.js';
import { Link } from '../lib/router.jsx';

const IMG = (name) => `${import.meta.env.BASE_URL}img/${name}`;

const WEEK = [
  ['Build', 'A few hours of focused work with other people around. Say what you’re on, then get on with it.'],
  ['Break bread', 'Dinner after, somewhere in Kits. It happens when three or more stay. Everyone pays their own way.'],
  ['Stay in the loop', 'One short note on Sunday: what’s on, what people are working on, who could use a hand.'],
];

const INSIDE = [
  ['This week', 'The weekly session, who’s in, and whether dinner’s on. Plus anything a host has planned.'],
  ['Working on', 'One line each about what you’re building this week. A running log lives on your profile.'],
  ['Needs help', 'Specific asks, like an intro, a tester or a second opinion. Tap “I can help” and follow up.'],
  ['Our Spots', 'The cafés, long-table dinners and spots by the water that members actually go to.'],
  ['Takeaways', 'A useful idea from a session, saved when one comes up. No minutes, no homework.'],
  ['Hosts', 'Members trusted to run things: a Saturday run, a founder breakfast, the weekly session.'],
];

const QUIET = [
  ['No feed', 'Nothing to scroll. Open it, see the week, close it.'],
  ['No likes or followers', 'Nobody is keeping score.'],
  ['No DMs', 'Profiles link to email, LinkedIn or Instagram. Follow up wherever you already talk.'],
  ['Invite-only', 'Everyone here was brought in by someone already in.'],
  ['Neighbourhood, never address', 'Kitside only ever shows the area you live in.'],
];

export default function Landing() {
  return (
    <div className="landing">
      <section className="l-hero">
        <picture className="l-hero-bg">
          <source media="(max-width: 760px)" srcSet={IMG('hero-sunset-portrait.jpg')} />
          <source media="(max-width: 1400px)" srcSet={IMG('hero-sunset-1400.jpg')} />
          <img src={IMG('hero-sunset-2400.jpg')} alt="Sunset over English Bay from the rocks at Kits" fetchpriority="high" />
        </picture>
        <div className="l-hero-inner">
          <div className="l-hero-copy">
            <p className="l-eyebrow">Kitsilano, Vancouver</p>
            <h1>Building something in&nbsp;Kits?</h1>
            <p className="l-lede">
              Kitside is a small, invite-only group of founders, builders and creatives who live nearby.
              We work side by side once a week, then stay for dinner if we feel like it.
            </p>
            <div className="l-actions">
              <Link to="/join" className="btn btn-sun btn-lg">I have an invite</Link>
              {MODE === 'live' ? <DemoButton className="btn btn-glass btn-lg">See how it works</DemoButton> : <Link to="/" className="btn btn-glass btn-lg">See how it works</Link>}
            </div>
          </div>
          <WavesCard />
        </div>
      </section>

      <section className="l-band l-week">
        <figure className="l-photo l-photo-wide">
          <img src={IMG('kits-park-people.jpg')} alt="People on the grass at Kits Beach park at golden hour" loading="lazy" />
        </figure>
        <div className="l-week-copy">
          <p className="l-kicker">The weekly rhythm</p>
          <h2>Same day, same people, every week.</h2>
          <p className="l-text">Community comes from showing up again and again, so Kitside is built around one weekly session.</p>
          <ol className="l-steps">
            {WEEK.map(([t, d], i) => (
              <li key={t}>
                <span className="l-step-n">{i + 1}</span>
                <div><h3>{t}</h3><p>{d}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="l-band l-note">
        <div className="l-note-copy">
          <p className="l-kicker">The Sunday note</p>
          <h2>Read it in a minute.</h2>
          <p className="l-text">
            Updates only, one line each. If a section is empty, it’s left out. It’s the only notification Kitside sends.
          </p>
        </div>
        <div className="note l-note-card" aria-label="An example Sunday note">
          <header className="note-head"><span className="note-from">Kitside</span><h3>Kitside · Week of Oct 26</h3></header>
          <section className="note-section"><h4>This week</h4><ul>
            <li>Build &amp; Break Bread: Wed 4:00 PM, West 4th · dinner after (3 in)</li>
            <li>Saturday run: Sat 9:00 AM, Point Grey Road</li>
          </ul></section>
          <section className="note-section"><h4>Working on</h4><ul>
            <li><b>Tom</b>: First paying bike shop goes live Thursday</li>
            <li><b>Maya</b>: Accessibility checker beta, first 10 teams</li>
          </ul></section>
          <section className="note-section"><h4>Needs help</h4><ul>
            <li><b>Rachel</b>: Intros to anyone who’s hired a first engineer in Vancouver</li>
          </ul></section>
          <p className="l-note-tag">Example</p>
        </div>
      </section>

      <section className="l-band l-inside">
        <div className="l-head">
          <p className="l-kicker">Inside Kitside</p>
          <h2>Everything points back to the table.</h2>
        </div>
        <ul className="l-grid">
          {INSIDE.map(([t, d]) => <li key={t}><h3>{t}</h3><p>{d}</p></li>)}
        </ul>
      </section>

      <section className="l-band l-quiet">
        <figure className="l-photo l-photo-tall">
          <img src={IMG('kits-point-evening.jpg')} alt="Evening sun over the grass at Kits Point" loading="lazy" />
        </figure>
        <div>
          <p className="l-kicker">Quiet by design</p>
          <h2>Less to check. More reasons to show up.</h2>
          <dl className="l-quiet-list">
            {QUIET.map(([t, d]) => <div key={t}><dt>{t}</dt><dd>{d}</dd></div>)}
          </dl>
        </div>
      </section>

      <section className="l-closing">
        <img className="l-closing-bg" src={IMG('kits-pink-sky.jpg')} alt="" loading="lazy" />
        <div className="l-closing-inner">
          <h2>Kits is better with your people in it.</h2>
          <p>If a member sent you a code, you’re one minute away.</p>
          <div className="l-actions">
            <Link to="/join" className="btn btn-sun btn-lg">I have an invite</Link>
            {MODE === 'live' && <DemoButton className="btn btn-glass btn-lg">See the demo</DemoButton>}
          </div>
        </div>
      </section>
    </div>
  );
}

/** The waves clip, only loaded on wider screens, paused for reduced motion. */
function WavesCard() {
  const [show, setShow] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)');
    const on = () => setShow(mq.matches);
    on();
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  useEffect(() => {
    if (show && window.matchMedia('(prefers-reduced-motion: reduce)').matches) ref.current?.pause();
  }, [show]);
  if (!show) return null;
  return (
    <figure className="l-waves">
      <video ref={ref} src={IMG('kits-waves.mp4')} poster={IMG('kits-waves-poster.jpg')} autoPlay muted loop playsInline preload="metadata" aria-label="Waves rolling in at sunset in Kits" />
      <figcaption>Kits, most evenings</figcaption>
    </figure>
  );
}
