import { MutableRefObject, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scroll to an element if the id matches the location hash.
 *
 * @param ref - A React ref which holds the the element to scroll to.
 */
export function useScrollTo(ref: MutableRefObject<HTMLElement>): void {
  const { hash } = useLocation();

  useEffect(() => {
    const element = ref.current;

    if (!element?.id) {
      return;
    }

    if (hash.slice(1) !== element.id) {
      return;
    }

    window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - 52 });
  }, [hash, ref]);
}
