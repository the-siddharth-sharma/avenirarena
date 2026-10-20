import { useState, useEffect, useCallback } from 'react';

export interface RouteState {
  path: string;
  params: Record<string, string>;
}

export const PUBLIC_ROUTES = ['/', '/login', '/auth'] as const;

export function isPublicRoute(path: string): boolean {
  const clean = path.replace(/^#/, '').split('?')[0].trim();
  return clean === '' || clean === '/' || clean === '/login' || clean === '/auth';
}

export function isProtectedRoute(path: string): boolean {
  return !isPublicRoute(path);
}

export function getHashPath(): string {
  if (typeof window === 'undefined') return '/';
  const hash = window.location.hash.replace(/^#/, '');
  const clean = hash.split('?')[0].trim();
  if (!clean || clean === '/') return '/';
  return clean.startsWith('/') ? clean : `/${clean}`;
}

export function useRouter() {
  const [path, setPath] = useState<string>(getHashPath());

  useEffect(() => {
    const handler = () => {
      const nextPath = getHashPath();
      setPath(nextPath);
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = useCallback((to: string) => {
    const target = to.startsWith('#') ? to.slice(1) : to;
    const cleanTarget = target.startsWith('/') ? target : `/${target}`;
    
    // Prevent recursive or redundant hash updates that cause bounce loops
    const currentClean = window.location.hash.replace(/^#/, '').split('?')[0].trim();
    if (currentClean !== cleanTarget) {
      window.location.hash = cleanTarget;
    }
  }, []);

  return {
    path,
    navigate,
    isPublic: isPublicRoute(path),
    isProtected: isProtectedRoute(path),
  };
}
