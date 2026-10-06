import { useState } from 'react';
import { api } from '../lib/api.js';
import { categoryTone } from '../lib/constants.js';
import { dayLabel, timeLabel } from '../lib/format.js';
import { useSession } from '../state/session.jsx';
import { useToast } from '../state/toast.jsx';
import InterestButton from './InterestButton.jsx';
import MoreMenu from './MoreMenu.jsx';
import { PinIcon } from './PersonCard.jsx';
import ReportDialog from './ReportDialog.jsx';
import { Avatar, DemoTag, PersonLink } from './ui.jsx';

export default function ActivityCard({ activity, compact = false, onDeleted }) {
  const { user } = useSession();
  const toast = useToast();
  const [reporting, setReporting] = useState(false);
  const d = new Date(activity.startsAt);
  const isHost = user && activity.hostId === user.id;

  async function remove() {
    if (!window.confirm('Cancel this activity? People who said they’re in will no longer see it.')) return;
    try {
      await api.deleteActivity(activity.id);
      toast('Activity cancelled.');
      onDeleted?.(activity.id);
    } catch (e) { toast(e.message, 'error'); }
  }

  return (
    <article className={`activity-card tone-${categoryTone(activity.category)} ${compact ? 'is-compact' : ''}`}>
      <div className="date-tag" aria-hidden="true">
        <span className="date-tag-day">{d.toLocaleDateString('en-CA', { weekday: 'short' })}</span>
        <span className="date-tag-num">{d.getDate()}</span>
      </div>
      <div className="activity-body">
        <div className="activity-meta">
          <span className="category">{activity.category}</span>
          {activity.isDemo && <DemoTag />}
          {!compact && (
            <MoreMenu items={[
              isHost && { label: 'Cancel activity', danger: true, onSelect: remove },
              user && !isHost && { label: 'Report', onSelect: () => setReporting(true) },
            ]} />
          )}
        </div>
        <h3>{activity.title}</h3>
        <p className="activity-when">
          <time dateTime={activity.startsAt}>{dayLabel(d)}, {timeLabel(d)}</time>
          <span className="place"><PinIcon />{activity.location}</span>
        </p>
        {!compact && activity.description && <p className="activity-desc">{activity.description}</p>}
        <div className="activity-foot">
          {!compact && (
            <span className="host">
              <Avatar profile={activity.host} size={26} />
              <span>Hosted by <PersonLink profile={activity.host} /></span>
            </span>
          )}
          <InterestButton
            key={activity.id}
            size={compact ? 'small' : undefined}
            interestedIds={activity.interestedIds}
            onSave={(on) => api.setActivityInterest(activity.id, on)}
          />
        </div>
      </div>
      {reporting && <ReportDialog targetType="activity" targetId={activity.id} subject="this activity" onClose={() => setReporting(false)} />}
    </article>
  );
}
