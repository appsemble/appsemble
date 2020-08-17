import type { BulmaColor } from '@appsemble/sdk';
import type { IconName, IconPrefix } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { Fragment, h, VNode } from 'preact';

import { Icon, Props } from '..';

interface ButtonProps extends Omit<Props<'button'>, 'loading'> {
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
  iconPrefix,
  inverted,
  loading,
  ...props
}: ButtonProps): VNode {
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
        <Fragment>
          <Icon icon={icon} prefix={iconPrefix} />
          {children && <span>{children}</span>}
        </Fragment>
      ) : (
        children
      )}
    </button>
  );
}
