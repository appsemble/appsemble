import classNames from 'classnames';
import React, { KeyboardEvent, ReactElement, ReactNode, useCallback, useRef } from 'react';

import { Button, Icon, useClickOutside, useToggle } from '..';

interface DropdownProps {
  /**
   * The children to render as menu items.
   *
   * Typically these are nodes that have the `dropdown-item` or `dropdown-divicer` class.
   */
  children: ReactNode;

  /**
   * An optional class name to add to the root element.
   */
  className?: string;

  /**
   * The label to render on the menu toggle button.
   */
  label: ReactNode;
}

/**
 * Render an aria compliant Bulma dropdown menu.
 */
export function Dropdown({ children, className, label }: DropdownProps): ReactElement {
  const ref = useRef<HTMLDivElement>();
  const { disable, enabled, toggle } = useToggle();

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        disable();
      }
    },
    [disable],
  );

  useClickOutside(ref, disable);

  return (
    <div className={classNames('dropdown', className, { 'is-active': enabled })} ref={ref}>
      <div className="dropdown-trigger">
        <Button
          aria-haspopup
          // This is important for Safari.
          className="py-0"
          onClick={toggle}
          onKeyDown={onKeyDown}
        >
          {label}
          <Icon icon="angle-down" size="small" />
        </Button>
      </div>
      <div
        className="dropdown-menu"
        onClick={toggle}
        onKeyDown={onKeyDown}
        role="menu"
        tabIndex={0}
      >
        <div className="dropdown-content">{children}</div>
      </div>
    </div>
  );
}
