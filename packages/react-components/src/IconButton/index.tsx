import { IconName, IconPrefix } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { ComponentPropsWithoutRef, ReactElement } from 'react';

import styles from './index.css';

interface IconButtonProps extends ComponentPropsWithoutRef<'button'> {
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
 * Render an button which looks like an icon, but with button behaviour.
 *
 * The button type is set to `button` by default.
 */
export function IconButton({
  className,
  icon,
  prefix = 'fas',
  ...props
}: IconButtonProps): ReactElement {
  return (
    <button className={classNames('icon', styles.root, className)} type="button" {...props}>
      <i className={`${prefix} fa-${icon}`} />
    </button>
  );
}
