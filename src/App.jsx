import { BottomNav, DemoButton, Footer, PreviewBanner, TopNav } from './components/Layout.jsx';
import { EmptyState } from './components/ui.jsx';
import { Link, Redirect, useRoute } from './lib/router.jsx';
import { MODE } from './lib/config.js';
import Landing from './pages/Landing.jsx';
import Join from './pages/Join.jsx';
import MyProfile from './pages/MyProfile.jsx';
import Note from './pages/Note.jsx';
import People from './pages/People.jsx';
import Person from './pages/Person.jsx';
import Spots from './pages/Spots.jsx';
import Takeaways from './pages/Takeaways.jsx';
import Updates from './pages/Updates.jsx';
import Week from './pages/Week.jsx';
import Welcome from './pages/Welcome.jsx';
import { useSession } from './state/session.jsx';

const MEMBER_PAGES = ['people', 'person', 'updates', 'spots', 'takeaways', 'note'];

function Page({ route }) {
  const { isMember, loading } = useSession();
  const next = route.query.get('next') || '/';
  // Visitors to the live site see the landing page; the demo and local preview are open to look around.
  const open = isMember || MODE !== 'live';
  if (MEMBER_PAGES.includes(route.name) && !open) return loading ? null : <MembersOnly />;
  switch (route.name) {
    case 'home': return isMember || (MODE !== 'live' && route.query.get('view') !== 'landing') ? <Week /> : loading ? null : <Landing />;
    case 'people': return <People />;
    case 'person': return <Person id={route.params.id} />;
    case 'updates': return <Updates tab={route.query.get('tab')} />;
    case 'spots': return <Spots />;
    case 'takeaways': return <Takeaways />;
    case 'note': return <Note />;
    case 'things': return <Redirect to="/" />;
    case 'announcements': return <Redirect to="/updates?tab=ask" />;
    case 'join': return <Join mode="join" next={next} invite={route.query.get('invite') || ''} />;
    case 'login': return <Join mode="login" next={next} />;
    case 'welcome': return <Welcome />;
    case 'me': return <MyProfile />;
    default:
      return (
        <div className="page">
          <EmptyState title="This page wandered off." body="It might have moved, or the link is off by a letter."
            action={<Link className="btn btn-primary" to="/">Back to Kitside</Link>} />
        </div>
      );
  }
}

function MembersOnly() {
  return (
    <div className="page">
      <EmptyState title="This part is for members." body="Kitside is invite-only. If someone sent you an invite, join with it here. Otherwise, the demo shows how it works."
        action={<div className="empty-actions"><Link className="btn btn-primary" to="/join">I have an invite</Link><DemoButton className="btn btn-demo">See the demo</DemoButton></div>} />
    </div>
  );
}

export default function App() {
  const route = useRoute();
  const { user, profile, loading, isMember } = useSession();
  const needsOnboarding = !loading && user && !profile && !['welcome', 'join', 'login'].includes(route.name);
  const isHome = route.name === 'home' && !isMember && (MODE === 'live' || route.query.get('view') === 'landing');

  return (
    <div className={`app route-${route.name} ${isHome ? 'is-landing' : ''}`}>
      <a href="#main" className="skip-link" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
      <PreviewBanner />
      <TopNav route={route} overlay={isHome} />
      <main id="main" tabIndex={-1} key={route.path} className="main">
        {needsOnboarding ? <Redirect to="/welcome" /> : <Page route={route} />}
      </main>
      <Footer />
      <BottomNav route={route} />
    </div>
  );
}
