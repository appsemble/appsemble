import classNames from 'classnames';
import * as React from 'react';

import styles from './index.css';

interface ContentProps {
  /**
   * An additional class name to append to the element.
   */
  className?: string;

  /**
   * Children to render inside the content wrapper.
   */
  children: React.ReactNode;

  /**
   * If true, don’t apply a maximum width
   */
  fullwidth?: boolean;

  /**
   * If true, add a padding of 10px.
   */
  pad?: boolean;
}

/**
 * An element to wrap content in a centered 480px max width element.
 */
export default function Content({
  children,
  className,
  fullwidth,
  pad,
}: ContentProps): React.ReactElement {
  return (
    <div className={classNames(className, { [styles.center]: !fullwidth, [styles.pad]: pad })}>
      {children}
    </div>
  );
}
