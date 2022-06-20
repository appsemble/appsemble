import { BulmaColor } from '@appsemble/sdk';
import { IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { ComponentProps, VNode } from 'preact';

import { Icon } from '..';

interface ButtonProps extends Omit<ComponentProps<'button'>, 'loading'> {
  /**
   * The bulma color to apply to the button.
   */
  color?: BulmaColor;

  /**
   * A Font Awesome icon name to render left of the button text.
   */
  icon?: IconName;

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
        <>
          <Icon icon={icon} />
          {children ? <span>{children}</span> : null}
        </>
      ) : (
        children
      )}
    </button>
  );
}
