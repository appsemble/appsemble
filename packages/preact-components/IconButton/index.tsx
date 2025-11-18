import { type BulmaColor } from '@appsemble/lang-sdk';
import { fa } from '@appsemble/web-utils';
import { type IconName, type IconPrefix } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { type VNode } from 'preact';
import { type ComponentPropsWithoutRef } from 'preact/compat';

import styles from './index.module.css';

interface IconButtonProps extends ComponentPropsWithoutRef<'button'> {
  /**
   * The color for the icon.
   */
  readonly color?: BulmaColor;

  /**
   * The Fontawesome icon to render.
   */
  readonly icon: IconName;

  /**
   * The Fontawesome prefix.
   */
  readonly prefix?: IconPrefix;
}

/**
 * Render an button which looks like an icon, but with button Behavior.
 *
 * The button type is set to `button` by default.
 */
export function IconButton({ className, color, icon, ...props }: IconButtonProps): VNode {
  return (
    <button
      className={classNames('icon', styles.root, className, { [`has-text-${color}`]: color })}
      type="button"
      {...props}
    >
      <i className={fa(icon)} />
    </button>
  );
}
