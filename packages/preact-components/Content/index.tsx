import classNames from 'classnames';
import { type ComponentChildren, type JSX, type VNode } from 'preact';

import styles from './index.module.css';

interface ContentProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> {
  /**
   * An additional class name to append to the element.
   */
  readonly className?: string;

  /**
   * Children to render inside the content wrapper.
   */
  readonly children: ComponentChildren;

  /**
   * If true, don’t apply a maximum width
   */
  readonly fullwidth?: boolean;

  /**
   * If true, consider this to be the main content on the page.
   *
   * The difference is that a `<main />` element will be rendered instead of a `<div />`.
   */
  readonly main?: boolean;

  /**
   * If true, add a padding of 12px.
   */
  readonly padding?: boolean;
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
  ...props
}: ContentProps): VNode {
  const Component = main ? 'main' : 'div';

  return (
    <Component
      className={classNames(className, { [styles.center]: !fullwidth, 'px-3 py-3': padding })}
      {...props}
    >
      {children}
    </Component>
  );
}
