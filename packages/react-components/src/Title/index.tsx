import * as React from 'react';

interface TitleProps {
  /**
   * The content to render inside the header element.
   */
  children: React.ReactNode;

  /**
   * The header level.
   */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * A bulma styled title element.
 */
export default function Title({ children, level = 3 }: TitleProps): React.ReactElement {
  const Component = `h${level}` as 'h1';

  return <Component className={`title is-${level}`}>{children}</Component>;
}
