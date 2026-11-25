import { type IconReference } from '@appsemble/lang-sdk';
import classNames from 'classnames';
import { type ComponentChild, type ComponentChildren, type VNode } from 'preact';
import { type MutableRef, useCallback, useRef } from 'preact/hooks';

import styles from './index.module.css';
import { Button, Icon, useClickOutside, useToggle } from '../index.js';

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
   * An optional class name to add to the icon element.
   */
  readonly iconClassName?: string;

  /**
   * The label to render on the menu toggle button.
   */
  readonly label: ComponentChild;

  /**
   * The accessible name of the menu toggle button, for a button that shows no label.
   */
  readonly ariaLabel?: string;

  /**
   * The icon to display next to the label.
   */
  readonly icon?: IconReference;

  /**
   * Whether to render the dropdown trigger as a button.
   *
   * @default true
   */
  readonly asButton?: boolean;
}

/**
 * Render an aria compliant Bulma dropdown menu.
 */
export function Dropdown({
  ariaLabel,
  asButton = true,
  children,
  className,
  icon,
  iconClassName,
  label,
}: DropdownProps): VNode {
  const ref = useRef<HTMLDivElement>();
  const { disable, enabled, toggle } = useToggle();

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      event.stopPropagation();
      if (event.key === 'Escape') {
        disable();
      }
    },
    [disable],
  );

  const handleClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      toggle();
    },
    [toggle],
  );

  useClickOutside(ref as MutableRef<HTMLElement>, disable);

  return (
    <div
      className={classNames('dropdown', className, { 'is-active': enabled })}
      data-testid="dropdown"
      ref={(ref as MutableRef<HTMLDivElement>) || undefined}
    >
      <div className="dropdown-trigger">
        {asButton ? (
          <Button
            aria-expanded={enabled}
            aria-haspopup
            aria-label={ariaLabel}
            icon={icon}
            onClick={handleClick}
            onKeyDown={onKeyDown}
          >
            {label}
          </Button>
        ) : (
          <button
            aria-expanded={enabled}
            aria-haspopup
            className={styles.trigger}
            onClick={handleClick}
            onKeyDown={onKeyDown}
            type="button"
          >
            {/* @ts-expect-error strictNullChecks not assignable to type */}
            <Icon className={iconClassName} icon={icon} />
            <span className="is-sr-only">{label}</span>
          </button>
        )}
      </div>
      <div
        className={classNames('dropdown-menu', styles['dropdown-menu'])}
        data-testid="dropdown-menu"
        onClick={handleClick}
        onKeyDown={onKeyDown}
        role="menu"
        tabIndex={0}
      >
        <div className="dropdown-content">{children}</div>
      </div>
    </div>
  );
}
