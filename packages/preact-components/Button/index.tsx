import { type BulmaColor } from '@appsemble/types';
import { type IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { type ComponentProps, type VNode } from 'preact';
import { type MutableRef } from 'preact/hooks';

import styles from './index.module.css';
import { Icon, useCombinedRefs } from '../index.js';

interface ButtonProps extends Omit<ComponentProps<'button'>, 'loading'> {
  /**
   * A custom class name to add to the button.
   */
  readonly className?: string;

  /**
   * The bulma color to apply to the button.
   */
  readonly color?: BulmaColor;

  /**
   * A Font Awesome icon name to render left of the button text.
   */
  readonly icon?: IconName;

  /**
   * Whether to set the icon's position right.
   */
  readonly iconRight?: boolean;

  /**
   * Set to true to invert the colors.
   */
  readonly inverted?: boolean;

  /**
   * Set to true to indicate the button is in a loading state.
   */
  readonly loading?: boolean;

  /**
   * The ref to the element used for scrolling to the field error
   */
  readonly errorLinkRef?: MutableRef<HTMLElement>;
}

/**
 * Render a button with Bulma styling.
 *
 * The button type is set to `button` by default.
 */
export function Button({
  children,
  className,
  color,
  errorLinkRef,
  icon,
  iconRight = false,
  inverted,
  loading,
  ref,
  ...props
}: ButtonProps): VNode {
  const combinedRef = useCombinedRefs(
    ref as MutableRef<HTMLButtonElement>,
    errorLinkRef as MutableRef<HTMLElement>,
  );
  return (
    <button
      className={classNames('button', className, {
        [`is-${color}`]: color,
        'is-inverted': inverted,
        'is-loading': loading,
      })}
      ref={combinedRef}
      type="button"
      {...props}
    >
      {icon ? (
        iconRight ? (
          <div class="mr-5">
            {children ? <span>{children}</span> : null}
            <Icon className={styles.rightIcon} icon={icon} />
          </div>
        ) : (
          <>
            <Icon icon={icon} />
            {children ? <span>{children}</span> : null}
          </>
        )
      ) : (
        children
      )}
    </button>
  );
}
