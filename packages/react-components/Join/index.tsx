import { Children, Fragment, type ReactNode } from 'react';

interface JoinProps {
  children: ReactNode;
  separator: ReactNode;
}

/**
 * Join React JSX children using a separator node.
 */
export function Join({ children, separator }: JoinProps): ReactNode {
  let count = 0;
  return Children.map(children, (child) => {
    if (typeof child !== 'object') {
      return null;
    }
    if (!child) {
      return null;
    }
    count += 1;
    if (count === 1) {
      return child;
    }
    return (
      <Fragment key={('key' in child ? child.key : null) ?? count}>
        {separator}
        {child}
      </Fragment>
    );
  });
}
