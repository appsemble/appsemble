import type { BulmaColor } from '@appsemble/sdk';
import type { IconName, IconPrefix } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import * as React from 'react';

import Icon from '../Icon';

interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
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
export default function Button({
  children,
  className,
  color,
  icon,
  iconPrefix,
  inverted,
  loading,
  ...props
}: ButtonProps): React.ReactElement {
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
          <Icon icon={icon} prefix={iconPrefix} />
          {children && <span>{children}</span>}
        </>
      ) : (
        children
      )}
    </button>
  );
}
