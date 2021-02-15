import { BulmaColor } from '@appsemble/sdk';
import classNames from 'classnames';
import { ComponentPropsWithoutRef, ReactElement } from 'react';

import { ButtonChildren } from '..';

type ButtonProps = ComponentPropsWithoutRef<'button'> &
  ComponentPropsWithoutRef<typeof ButtonChildren> & {
    /**
     * The bulma color to apply to the button.
     */
    color?: BulmaColor;

    /**
     * Set to true to invert the colors.
     */
    inverted?: boolean;

    /**
     * Set to true to indicate the button is in a loading state.
     */
    loading?: boolean;
  };

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
      <ButtonChildren icon={icon} iconPosition={iconPosition} iconPrefix={iconPrefix}>
        {children}
      </ButtonChildren>
    </button>
  );
}
