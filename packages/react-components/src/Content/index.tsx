import classNames from 'classnames';
import React, { ReactElement, ReactNode } from 'react';

import styles from './index.css';

interface ContentProps {
  /**
   * An additional class name to append to the element.
   */
  className?: string;

  /**
   * Children to render inside the content wrapper.
   */
  children: ReactNode;

  /**
   * If true, don’t apply a maximum width
   */
  fullwidth?: boolean;

  /**
   * If true, add a padding of 12px.
   */
  padding?: boolean;
}

/**
 * An element to wrap content in a centered 480px max width element.
 */
export default function Content({
  children,
  className,
  fullwidth,
  padding,
}: ContentProps): ReactElement {
  return (
    <div className={classNames(className, { [styles.center]: !fullwidth, 'px-3 py-3': padding })}>
      {children}
    </div>
  );
}
