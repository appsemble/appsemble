import classNames from 'classnames';
import * as React from 'react';

interface TitleProps {
  /**
   * The content to render inside the header element.
   */
  children: React.ReactNode;

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
export default function Title({ children, className, level = 3 }: TitleProps): React.ReactElement {
  const Component = `h${level}` as 'h1';

  return <Component className={classNames(`title is-${level}`, className)}>{children}</Component>;
}
