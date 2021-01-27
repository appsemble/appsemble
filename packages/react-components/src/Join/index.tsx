import { Children, ReactElement, ReactNode } from 'react';

interface JoinProps {
  children: ReactNode;
  separator: ReactNode;
}

/**
 * Join React JSX children using a separator node.
 */
export function Join({ children, separator }: JoinProps): ReactElement {
  return Children.toArray(children)
    .filter((child) => child != null && typeof child !== 'boolean')
    .map((child, index) => (
      // eslint-disable-next-line react/jsx-key
      <>
        {index ? separator : null}
        {child}
      </>
    )) as any;
}
