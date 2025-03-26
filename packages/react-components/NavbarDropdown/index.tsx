import { type BulmaColor } from '@appsemble/types';
import classNames from 'classnames';
import { type KeyboardEvent, type ReactNode, useCallback, useRef } from 'react';

import styles from './index.module.css';
import { useClickOutside, useToggle } from '../index.js';

interface NavbarDropdownProps {
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
   * The color applied to the toggle button.
   */
  readonly color?: BulmaColor;
}

export function NavbarDropdown({
  children,
  className,
  color,
  label,
}: NavbarDropdownProps): ReactNode {
  const toggle = useToggle();

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        toggle.disable();
      }
    },
    [toggle],
  );

  const onClick = useCallback(() => {
    toggle.toggle();
  }, [toggle]);

  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, toggle.disable);

  return (
    <div
      className={classNames([
        'navbar-item',
        'has-dropdown',
        className,
        { 'is-active': toggle.enabled },
      ])}
      ref={ref}
    >
      <button
        className={`navbar-link ${styles.dropdown}`}
        color={color}
        onClick={onClick}
        type="button"
      >
        {label}
      </button>
      <div
        className="navbar-dropdown is-right"
        onClick={toggle.disable}
        onKeyDown={onKeyDown}
        role="menu"
        tabIndex={0}
      >
        {children}
      </div>
    </div>
  );
}
