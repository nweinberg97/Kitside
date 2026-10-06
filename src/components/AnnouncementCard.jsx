import { useState } from 'react';
import { api } from '../lib/api.js';
import { categoryTone } from '../lib/constants.js';
import { ago, dateOnlyLabel, hhmmLabel } from '../lib/format.js';
import { useSession } from '../state/session.jsx';
import { useToast } from '../state/toast.jsx';
import InterestButton from './InterestButton.jsx';
import MoreMenu from './MoreMenu.jsx';
import { PinIcon } from './PersonCard.jsx';
import ReportDialog from './ReportDialog.jsx';
import { Avatar, DemoTag, PersonLink } from './ui.jsx';

export default function AnnouncementCard({ post, onDeleted, fresh = false }) {
  const { user } = useSession();
  const toast = useToast();
  const [reporting, setReporting] = useState(false);
  const mine = user && post.authorId === user.id;
  const when = [dateOnlyLabel(post.happensOn), hhmmLabel(post.happensAt)].filter(Boolean).join(', ');

  async function remove() {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.deleteAnnouncement(post.id);
      toast('Post deleted.');
      onDeleted?.(post.id);
    } catch (e) { toast(e.message, 'error'); }
  }

  return (
    <article className={`post ${fresh ? 'is-fresh' : ''}`}>
      <header className="post-head">
        <Avatar profile={post.author} size={40} />
        <div className="post-who">
          <PersonLink profile={post.author} />
          <span className="muted">
            {post.author?.neighbourhood ? `${post.author.neighbourhood}, ` : ''}{ago(post.createdAt)}
          </span>
        </div>
        {post.isDemo && <DemoTag />}
        <MoreMenu items={[
          mine && { label: 'Delete post', danger: true, onSelect: remove },
          user && !mine && { label: 'Report post', onSelect: () => setReporting(true) },
        ]} />
      </header>
      <h3 className="post-title">{post.title}</h3>
      {post.details && <p className="post-details">{post.details}</p>}
      {(when || post.location || post.category) && (
        <p className="post-facts">
          {post.category && <span className={`category tone-${categoryTone(post.category)}`}>{post.category}</span>}
          {when && <span>{when}</span>}
          {post.location && <span className="place"><PinIcon />{post.location}</span>}
        </p>
      )}
      <InterestButton key={post.id} interestedIds={post.interestedIds} onSave={(on) => api.setAnnouncementInterest(post.id, on)} />
      {reporting && <ReportDialog targetType="announcement" targetId={post.id} subject="this post" onClose={() => setReporting(false)} />}
    </article>
  );
}
