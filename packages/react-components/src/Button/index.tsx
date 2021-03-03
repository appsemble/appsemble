import { BulmaColor } from '@appsemble/sdk';
import classNames from 'classnames';
import { ComponentPropsWithoutRef, ElementType, ReactElement } from 'react';

import { ButtonChildren } from '..';

type ButtonProps<C extends ElementType = 'button'> = ComponentPropsWithoutRef<C> &
  ComponentPropsWithoutRef<typeof ButtonChildren> & {
    /**
     * The bulma color to apply to the button.
     */
    color?: BulmaColor;

    /**
     * The component type to use. This is specifically useful to create links that look like
     * buttons.
     */
    component?: C;

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
export function Button<C extends ElementType = 'button'>({
  children,
  className,
  color,
  component: Component = 'button',
  icon,
  iconPosition = 'left',
  iconPrefix,
  inverted,
  loading,
  ...props
}: ButtonProps<C> & Omit<ComponentPropsWithoutRef<C>, keyof ButtonProps<C>>): ReactElement {
  if (Component === 'button') {
    // @ts-expect-error TypeScript can’t statically determine the type from props based on
    // Component.
    // eslint-disable-next-line no-param-reassign
    props.type ??= 'button';
  }
  return (
    <Component
      className={classNames('button', className, {
        [`is-${color}`]: color,
        'is-inverted': inverted,
        'is-loading': loading,
      })}
      {...props}
    >
      <ButtonChildren icon={icon} iconPosition={iconPosition} iconPrefix={iconPrefix}>
        {children}
      </ButtonChildren>
    </Component>
  );
}
