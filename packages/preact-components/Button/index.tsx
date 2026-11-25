import { type BulmaColor } from '@appsemble/types';
import classNames from 'classnames';
import { type ComponentProps, type ComponentType, type JSX, type VNode } from 'preact';
import { type MutableRef } from 'preact/hooks';

import styles from './index.module.css';
import { ButtonChildren, type ButtonChildrenProps, Icon, useCombinedRefs } from '../index.js';

type ButtonComponent = ComponentType<any> | keyof JSX.IntrinsicElements;

type ButtonProps<C extends ButtonComponent = 'button'> = ButtonChildrenProps &
  Omit<ComponentProps<C>, keyof ButtonChildrenProps | 'loading'> & {
    /**
     * A custom class name to add to the button.
     */
    readonly className?: string;

    /**
     * The bulma color to apply to the button.
     */
    readonly color?: BulmaColor;

    /**
     * The component type to use. This is specifically useful to create links that look like
     * buttons.
     */
    readonly component?: C;

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
  };

/**
 * Render a button with Bulma styling.
 *
 * The button type is set to `button` by default when rendering a `button` element.
 */
export function Button<C extends ButtonComponent = 'button'>({
  children,
  className,
  color,
  component: Component = 'button' as C,
  errorLinkRef,
  icon,
  iconColor,
  iconPosition = 'left',
  iconRight = false,
  iconSize,
  iconSizeModifier,
  inverted,
  loading,
  ref,
  ...props
}: ButtonProps<C>): VNode {
  const combinedRef = useCombinedRefs(
    ref as MutableRef<HTMLElement>,
    errorLinkRef as MutableRef<HTMLElement>,
  );
  // TypeScript can't determine the props of a polymorphic component.
  const Tag = Component as 'button';
  return (
    <Tag
      className={classNames('button', className, {
        [`is-${color}`]: color,
        'is-inverted': inverted,
        'is-loading': loading,
      })}
      ref={combinedRef}
      type={Component === 'button' ? 'button' : undefined}
      {...props}
    >
      {icon && iconRight ? (
        <div class="mr-5">
          {children ? <span>{children}</span> : null}
          <Icon className={styles.rightIcon} icon={icon} />
        </div>
      ) : (
        <ButtonChildren
          icon={icon}
          iconColor={iconColor}
          iconPosition={iconPosition}
          iconSize={iconSize}
          iconSizeModifier={iconSizeModifier}
        >
          {children}
        </ButtonChildren>
      )}
    </Tag>
  );
}
