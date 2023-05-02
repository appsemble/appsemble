import classNames from 'classnames';
import { type MouseEvent, type ReactElement, type ReactNode, useCallback } from 'react';

import { useValuePicker } from '../index.js';

interface TabProps {
  /**
   * Child elements to render in the tab.
   */
  children: ReactNode;

  /**
   * An additional class name to apply to the root element.
   */
  className?: string;

  /**
   * The `href` to apply on the anchor tag.
   *
   * The value will be ignored when clicked. This is for display purposes only.
   */
  href?: string;

  /**
   * The value to emit when this tab is selected.
   */
  value: any;
}

/**
 * Render a single tab for use with the `<Tabs />` component.
 *
 * Beware that this renders an anchor element. This means no anchor elements should be rendered as
 * children.
 */
export function Tab({ children, className, href, value }: TabProps): ReactElement {
  const { onChange, value: currentValue } = useValuePicker();

  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();

      onChange(event, value);
    },
    [onChange, value],
  );

  return (
    <li className={classNames(className, { 'is-active': currentValue === value })}>
      <a href={href} onClick={handleClick}>
        {children}
      </a>
    </li>
  );
}
