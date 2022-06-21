import { BulmaColor } from '@appsemble/types';
import classNames from 'classnames';
import { KeyboardEvent, ReactElement, ReactNode, useCallback, useRef } from 'react';

import { useClickOutside, useToggle } from '..';
import { useSideMenuState } from '../SideMenu';
import styles from './index.module.css';

interface NavbarDropdownProps {
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

  /**
   * The color applied to the toggle button.
   */
  color?: BulmaColor;
}

export function NavbarDropdown({
  children,
  className,
  color,
  label,
}: NavbarDropdownProps): ReactElement {
  const toggle = useToggle();
  const { disable: disableMenu } = useSideMenuState();

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
    disableMenu?.();
  }, [disableMenu, toggle]);

  const ref = useRef<HTMLDivElement>();
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
