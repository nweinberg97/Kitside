/*
 * A deliberately tiny hash router (#/people/123). Hash URLs work on any static
 * host — GitHub Pages included — with no server rewrites.
 */
import { useEffect, useState } from 'react';

const ROUTES = [
  ['/', 'home'],
  ['/people', 'people'],
  ['/people/:id', 'person'],
  ['/things', 'things'],
  ['/announcements', 'announcements'],
  ['/join', 'join'],
  ['/login', 'login'],
  ['/welcome', 'welcome'],
  ['/me', 'me'],
];

export function parse(hash = window.location.hash) {
  const [path, query = ''] = hash.replace(/^#/, '').split('?');
  const clean = path.replace(/\/+$/, '') || '/';
  const parts = clean.split('/');
  for (const [pattern, name] of ROUTES) {
    const pp = pattern.split('/');
    if (pp.length !== parts.length) continue;
    const params = {};
    const ok = pp.every((seg, i) => (seg.startsWith(':') ? ((params[seg.slice(1)] = decodeURIComponent(parts[i])), true) : seg === parts[i]));
    if (ok) return { name, params, path: clean, query: new URLSearchParams(query) };
  }
  return { name: 'notfound', params: {}, path: clean, query: new URLSearchParams(query) };
}

export function useRoute() {
  const [route, setRoute] = useState(() => parse());
  useEffect(() => {
    const on = () => {
      setRoute(parse());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const href = (to) => `#${to}`;

export function navigate(to, { replace = false } = {}) {
  const url = href(to);
  if (replace) {
    window.history.replaceState(null, '', url);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = to;
  }
}

export function Redirect({ to }) {
  useEffect(() => { navigate(to, { replace: true }); }, [to]);
  return null;
}

export function Link({ to, children, ...rest }) {
  return <a href={href(to)} {...rest}>{children}</a>;
}
