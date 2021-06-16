import { ComponentPropsWithoutRef, FC, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

type Header = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

/**
 * Create a header component that is scrolled to automatically if the id matches the location hash.
 *
 * @param Component - The header component to create.
 * @returns A header component which is automaticall scrolled into view if the location hash
 * matches the element id.
 */
export function createHeader(Component: Header): FC<ComponentPropsWithoutRef<Header>> {
  return ({ id, ...props }) => {
    const ref = useRef<HTMLHeadingElement>();
    const { hash } = useLocation();

    useEffect(() => {
      if (hash.slice(1) !== id) {
        return;
      }

      const { top } = ref.current.getBoundingClientRect();
      window.scrollTo({ top: top + window.scrollY - 52, behavior: 'smooth' });
    }, [hash, id]);

    return <Component ref={ref} {...props} />;
  };
}
