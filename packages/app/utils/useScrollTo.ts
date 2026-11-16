import { type MutableRef, useEffect } from 'preact/hooks';
import { useLocation } from 'react-router-dom';

/**
 * Scroll to an element if the id matches the location hash.
 *
 * @param ref A ref which holds the the element to scroll to.
 */
export function useScrollTo(ref: MutableRef<HTMLElement | null>): void {
  const { hash } = useLocation();

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    if (!element?.id) {
      return;
    }

    if (hash.slice(1) !== element.id) {
      return;
    }

    window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - 52 });
  }, [hash, ref]);
}
