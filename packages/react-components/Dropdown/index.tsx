import { type IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { type KeyboardEvent, type ReactNode, useCallback, useRef } from 'react';

import { Button, Icon, useClickOutside, useToggle } from '../index.js';

interface DropdownProps {
  /**
   * The children to render as menu items.
   *
   * Typically these are nodes that have the `dropdown-item` or `dropdown-divider` class.
   */
  readonly children: ReactNode;

  /**
   * An optional class name to add to the root element.
   */
  readonly className?: string;

  /**
   * The label to render on the menu toggle button.
   */
  readonly label: ReactNode;

  /**
   * The icon to display next to the label.
   */
  readonly icon?: IconName;

  /**
   * The icon used for the dropdown icon next to the label.
   *
   * @default 'angle-down'
   */
  readonly dropdownIcon?: IconName;
}

/**
 * Render an aria compliant Bulma dropdown menu.
 */
export function Dropdown({
  children,
  className,
  dropdownIcon = 'angle-down',
  icon,
  label,
}: DropdownProps): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
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
          icon={icon}
          onClick={toggle}
          onKeyDown={onKeyDown}
        >
          {label}
          <Icon className="ml-1" icon={enabled ? 'chevron-up' : dropdownIcon} size="small" />
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
