import { useMemo, useState } from 'react';
import { AskList, UpdateComposer, WorkingOnList } from '../components/weekly.jsx';
import { ChipGroup, ErrorState, SkeletonGrid } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { LIMITS } from '../lib/constants.js';
import { useLoad } from '../lib/useLoad.js';
import { latestWorkingOn, openAsks } from '../lib/week.js';
import { useSession } from '../state/session.jsx';

const TABS = [{ id: 'working_on', label: 'Working on' }, { id: 'ask', label: 'Needs help' }];

/** One line each. They drop off after a week; your history stays on your profile. */
export default function Updates({ tab: initial = 'working_on' }) {
  const { blocked } = useSession();
  const [tab, setTab] = useState(initial === 'ask' ? 'ask' : 'working_on');
  const { data, error, loading, reload, setData } = useLoad(() => api.listUpdates({ days: 7 }), []);

  const list = useMemo(() => {
    const rows = (data || []).filter((u) => !blocked.has(u.authorId));
    return tab === 'ask' ? openAsks(rows) : latestWorkingOn(rows);
  }, [data, tab, blocked]);

  return (
    <div className="page page-narrow">
      <header className="page-head">
        <h1>Updates</h1>
        <p>
          One line each, about what you’re working on or what you need. They go out in Sunday’s note and drop off after a week.
        </p>
      </header>

      <ChipGroup label="Show" options={TABS} value={tab} onChange={setTab} />
      <UpdateComposer key={tab} kind={tab} onPosted={(u) => setData((d) => [u, ...(d || [])])} />
      <p className="field-hint composer-hint">
        {tab === 'ask' ? `Be specific: who or what you need, and roughly how long. ${LIMITS.ask} characters max.` : `Posting a new line replaces your last one. ${LIMITS.working_on} characters max.`}
      </p>

      {loading ? <SkeletonGrid count={3} className="stack" /> : error ? <ErrorState error={error} onRetry={reload} /> : (
        <div className="panel">
          {tab === 'ask'
            ? <AskList items={list} onChanged={reload} empty="No open asks. That’s either good news or a quiet week." />
            : <WorkingOnList items={list} empty="Nobody’s posted yet this week. Go first." />}
        </div>
      )}
    </div>
  );
}
