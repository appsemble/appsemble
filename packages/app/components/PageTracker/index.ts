import { useEffect } from 'react';
import { useLocation } from 'wouter-preact';

export function PageTracker(): null {
  const [pathname] = useLocation();

  useEffect(() => {
    if (typeof gtag !== 'undefined') {
      setTimeout(() => {
        gtag('set', 'page', pathname);
      }, 300);
    }
  }, [pathname]);

  return null;
}
