import classNames from 'classnames';
import { ReactElement, ReactNode } from 'react';

import styles from './index.module.css';

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
   * If true, consider this to be the main content on the page.
   *
   * The difference is that a `<main />` element will be rendered instead of a `<div />`.
   */
  main?: boolean;

  /**
   * If true, add a padding of 12px.
   */
  padding?: boolean;
}

/**
 * An element to wrap content in a centered 480px max width element.
 */
export function Content({
  children,
  className,
  fullwidth,
  main,
  padding,
}: ContentProps): ReactElement {
  const Component = main ? 'main' : 'div';

  return (
    <Component
      className={classNames(className, { [styles.center]: !fullwidth, 'px-3 py-3': padding })}
    >
      {children}
    </Component>
  );
}
