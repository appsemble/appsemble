import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare function gtag(command: string, ...args: unknown[]): void;

export function PageTracker(): null {
  const { pathname } = useLocation();

  useEffect(() => {
    if (typeof gtag !== 'undefined') {
      setTimeout(() => {
        gtag('set', 'page', pathname);
        gtag('send', 'pageview');
      }, 300);
    }
  }, [pathname]);

  return null;
}
