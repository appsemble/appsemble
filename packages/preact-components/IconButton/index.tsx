import { type BulmaColor, type IconReference } from '@appsemble/lang-sdk';
import classNames from 'classnames';
import { type VNode } from 'preact';
import { type ComponentPropsWithoutRef } from 'preact/compat';

import styles from './index.module.css';
import { Icon } from '../Icon/index.js';

interface IconButtonProps extends ComponentPropsWithoutRef<'button'> {
  /**
   * The color for the icon.
   */
  readonly color?: BulmaColor;

  /**
   * A Font Awesome icon name or an `icon:<key>` reference to the app’s icon registry.
   */
  readonly icon: IconReference;
}

/**
 * Render an button which looks like an icon, but with button Behavior.
 *
 * The button type is set to `button` by default.
 */
export function IconButton({ className, color, icon, ...props }: IconButtonProps): VNode {
  return (
    <Icon
      className={classNames(styles.root, className, { [`has-text-${color}`]: color })}
      component="button"
      icon={icon}
      type="button"
      {...props}
    />
  );
}
