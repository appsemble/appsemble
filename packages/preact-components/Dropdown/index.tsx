import { type IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { type ComponentChild, type ComponentChildren, type VNode } from 'preact';
import { useCallback, useRef } from 'preact/hooks';

import { Button, useClickOutside, useToggle } from '../index.js';

interface DropdownProps {
  /**
   * The children to render as menu items.
   *
   * Typically these are nodes that have the `dropdown-item` or `dropdown-divider` class.
   */
  readonly children: ComponentChildren;

  /**
   * An optional class name to add to the root element.
   */
  readonly className?: string;

  /**
   * The label to render on the menu toggle button.
   */
  readonly label: ComponentChild;

  /**
   * The icon to display next to the label.
   */
  readonly icon?: IconName;
}

/**
 * Render an aria compliant Bulma dropdown menu.
 */
export function Dropdown({ children, className, icon, label }: DropdownProps): VNode {
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
    <div
      className={classNames('dropdown', className, { 'is-active': enabled })}
      data-testid="dropdown"
      ref={ref}
    >
      <div className="dropdown-trigger">
        <Button aria-haspopup icon={icon} onClick={toggle} onKeyDown={onKeyDown}>
          {label}
        </Button>
      </div>
      <div
        className="dropdown-menu"
        data-testid="dropdown-menu"
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
