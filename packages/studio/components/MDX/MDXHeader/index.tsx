import { useScrollTo } from '@appsemble/react-components';
import { ComponentPropsWithoutRef, FC, useRef } from 'react';

type Header = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

/**
 * Create a header component that is scrolled to automatically if the id matches the location hash.
 *
 * @param Component - The header component to create.
 * @returns A header component which is automaticall scrolled into view if the location hash
 * matches the element id.
 */
export function createHeader(Component: Header): FC<ComponentPropsWithoutRef<Header>> {
  return (props) => {
    const ref = useRef<HTMLHeadingElement>();

    useScrollTo(ref);

    return <Component ref={ref} {...props} />;
  };
}
