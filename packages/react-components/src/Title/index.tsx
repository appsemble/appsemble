import classNames from 'classnames';
import React, { ReactElement, ReactNode } from 'react';

interface TitleProps {
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
   */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * A bulma styled title element.
 */
export function Title({ children, className, level = 3 }: TitleProps): ReactElement {
  const Component = `h${level}` as 'h1';

  return <Component className={classNames(`title is-${level}`, className)}>{children}</Component>;
}
