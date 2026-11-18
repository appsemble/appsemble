import classNames from 'classnames';
import { type ComponentChildren, type JSX, type VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import { useValuePicker } from '../index.js';

interface TabProps {
  /**
   * Child elements to render in the tab.
   */
  readonly children: ComponentChildren;

  /**
   * An additional class name to apply to the root element.
   */
  readonly className?: string;

  /**
   * The `href` to apply on the anchor tag.
   *
   * The value will be ignored when clicked. This is for display purposes only.
   */
  readonly href?: string;

  /**
   * The value to emit when this tab is selected.
   */
  readonly value: any;
}

/**
 * Render a single tab for use with the `<Tabs />` component.
 *
 * Beware that this renders an anchor element. This means no anchor elements should be rendered as
 * children.
 */
export function Tab({ children, className, href, value }: TabProps): VNode {
  const { onChange, value: currentValue } = useValuePicker();

  const handleClick = useCallback(
    (event: JSX.TargetedMouseEvent<HTMLAnchorElement>) => {
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
