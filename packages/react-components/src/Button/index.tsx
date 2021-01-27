import { BulmaColor } from '@appsemble/sdk';
import { IconName, IconPrefix } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { ComponentPropsWithoutRef, ReactElement } from 'react';

import { Icon } from '..';

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  /**
   * The bulma color to apply to the button.
   */
  color?: BulmaColor;

  /**
   * A Font Awesome icon name to render left of the button text.
   */
  icon?: IconName;

  /**
   * The Font Awesome prefix to apply to the icon.
   */
  iconPrefix?: IconPrefix;

  /**
   * Set to true to invert the colors.
   */
  inverted?: boolean;

  /**
   * Set to true to indicate the button is in a loading state.
   */
  loading?: boolean;

  /**
   * The position of the icon.
   *
   * @default 'left'
   */
  iconPosition?: 'left' | 'right';
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
  icon,
  iconPosition = 'left',
  iconPrefix,
  inverted,
  loading,
  ...props
}: ButtonProps): ReactElement {
  return (
    <button
      className={classNames('button', className, {
        [`is-${color}`]: color,
        'is-inverted': inverted,
        'is-loading': loading,
      })}
      type="button"
      {...props}
    >
      {icon ? (
        <>
          {iconPosition === 'left' && <Icon icon={icon} prefix={iconPrefix} />}
          {children && <span>{children}</span>}
          {iconPosition === 'right' && <Icon icon={icon} prefix={iconPrefix} />}
        </>
      ) : (
        children
      )}
    </button>
  );
}
