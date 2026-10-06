import { Link } from '../lib/router.jsx';
import { Avatar, DemoTag } from './ui.jsx';

export default function PersonCard({ person, compact = false }) {
  const into = person.interests.slice(0, compact ? 3 : 4);
  return (
    <Link to={`/people/${person.id}`} className={`person-card ${compact ? 'is-compact' : ''}`}>
      <div className="person-card-top">
        <Avatar profile={person} size={compact ? 52 : 60} />
        <div className="person-card-id">
          <h3>{person.name}</h3>
          <p className="person-card-role">{person.title || person.role}</p>
          <p className="place"><PinIcon />{person.neighbourhood}</p>
        </div>
        {person.isDemo && <DemoTag />}
      </div>
      {person.workingOn && (
        <p className="person-card-building">
          <span className="label-inline">Working on</span> {person.workingOn}
        </p>
      )}
      {into.length > 0 && <p className="person-card-into">Into {joinNatural(into.map((i) => i.toLowerCase()))}</p>}
      {!compact && person.lookingFor.length > 0 && (
        <ul className="open-to" aria-label="Open to">
          {person.lookingFor.slice(0, 3).map((l) => <li key={l}>{l}</li>)}
        </ul>
      )}
    </Link>
  );
}

export function PinIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden="true" className="pin-icon">
      <path d="M6 13s4.5-4.2 4.5-7.5A4.5 4.5 0 001.5 5.5C1.5 8.8 6 13 6 13z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="6" cy="5.5" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function joinNatural(list) {
  if (list.length <= 1) return list.join('');
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
}
