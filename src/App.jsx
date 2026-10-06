import { BottomNav, Footer, PreviewBanner, TopNav } from './components/Layout.jsx';
import { EmptyState } from './components/ui.jsx';
import { Link, Redirect, useRoute } from './lib/router.jsx';
import Announcements from './pages/Announcements.jsx';
import Home from './pages/Home.jsx';
import Join from './pages/Join.jsx';
import MyProfile from './pages/MyProfile.jsx';
import People from './pages/People.jsx';
import Person from './pages/Person.jsx';
import Things from './pages/Things.jsx';
import Welcome from './pages/Welcome.jsx';
import { useSession } from './state/session.jsx';

function Page({ route }) {
  const next = route.query.get('next') || '/';
  switch (route.name) {
    case 'home': return <Home />;
    case 'people': return <People />;
    case 'person': return <Person id={route.params.id} />;
    case 'things': return <Things />;
    case 'announcements': return <Announcements />;
    case 'join': return <Join mode="join" next={next} />;
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

export default function App() {
  const route = useRoute();
  const { user, profile, loading } = useSession();
  const needsOnboarding = !loading && user && !profile && !['welcome', 'join', 'login'].includes(route.name);
  const isHome = route.name === 'home';

  return (
    <div className={`app route-${route.name}`}>
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
