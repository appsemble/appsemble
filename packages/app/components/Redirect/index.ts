import { useEffect } from 'preact/hooks';
import { useLocation } from 'wouter-preact';

interface RedirectProps {
  readonly replace?: boolean;
  readonly to: string;
}

/**
 * Navigate to another location once, after the redirect mounts and has been painted.
 *
 * Navigating after paint gives each step of a redirect chain its own task, so following a chain
 * never renders several pages in one long task.
 */
export function Redirect({ replace, to }: RedirectProps): null {
  const [, navigate] = useLocation();

  useEffect(() => {
    navigate(to, { replace });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
