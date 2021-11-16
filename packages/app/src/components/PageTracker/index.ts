import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare function gtag(command: string, ...args: unknown[]): void;

export function PageTracker(): null {
  const { pathname } = useLocation();

  useEffect(() => {
    if (typeof gtag !== 'undefined') {
      gtag('set', 'page', pathname);
      gtag('send', 'pageview');
    }
  }, [pathname]);

  return null;
}
