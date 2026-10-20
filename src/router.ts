import { useState, useEffect, useCallback } from 'react';

export interface RouteState {
  path: string;
  params: Record<string, string>;
}

function getHashPath(): string {
  if (typeof window === 'undefined') return '/dashboard';
  const hash = window.location.hash.replace(/^#/, '');
  const clean = hash.split('?')[0].trim();
  return clean || '/dashboard';
}

export function useRouter() {
  const [path, setPath] = useState<string>(getHashPath());

  useEffect(() => {
    const handler = () => setPath(getHashPath());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = useCallback((to: string) => {
    window.location.hash = to;
  }, []);

  return { path, navigate };
}
