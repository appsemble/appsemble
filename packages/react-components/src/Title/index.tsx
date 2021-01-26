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
   *
   * By default this is determined from the specified size.
   */
  level?: 1 | 2 | 3 | 4 | 5 | 6;

  /**
   * The size of the header.
   *
   * @default 3
   */
  size?: 3 | 4 | 5 | 6;
}

/**
 * A bulma styled title element.
 */
export function Title({
  children,
  className,
  size = 3,
  level = (size - 2) as TitleProps['size'],
}: TitleProps): ReactElement {
  const Component = `h${level}` as 'h1';

  return <Component className={classNames(`title is-${size}`, className)}>{children}</Component>;
}
