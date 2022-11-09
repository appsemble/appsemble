import { BulmaColor } from '@appsemble/types';
import { fa } from '@appsemble/web-utils';
import { IconName, IconPrefix } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { ComponentPropsWithoutRef, ReactElement } from 'react';

import styles from './index.module.css';

interface IconButtonProps extends ComponentPropsWithoutRef<'button'> {
  /**
   * The color for the icon.
   */
  color?: BulmaColor;

  /**
   * The Fontawesome icon to render.
   */
  icon: IconName;

  /**
   * The Fontawesome prefix.
   */
  prefix?: IconPrefix;
}

/**
 * Render an button which looks like an icon, but with button Behavior.
 *
 * The button type is set to `button` by default.
 */
export function IconButton({ className, color, icon, ...props }: IconButtonProps): ReactElement {
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
