import classNames from 'classnames';
import React, { ReactElement, ReactNode } from 'react';

interface SubtitleProps {
  /**
   * The content to render inside the header element.
   */
  children: ReactNode;

  /**
   * An additional class name to add.
   */
  className?: string;

  /**
   * The header level.
   *
   * Note that this should be two higher than any `title` component.
   */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * A bulma styled subtitle element.
 */
export function Subtitle({ children, className, level = 5 }: SubtitleProps): ReactElement {
  const Component = `h${level}` as 'h1';

  return (
    <Component className={classNames(`subtitle is-${level}`, className)}>{children}</Component>
  );
}
