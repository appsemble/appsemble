import { type IconReference } from '@appsemble/lang-sdk';
import { type BulmaColor, type BulmaSize } from '@appsemble/types';
import { fa, getIconSizeModifier, type IconSizeModifier, resolveIcon } from '@appsemble/web-utils';
import classNames from 'classnames';
import { type ComponentProps, type ReactNode, useState } from 'react';

import styles from './index.module.css';
import { useIconContext } from '../IconProvider/index.js';

interface IconProps extends ComponentProps<'span'> {
  readonly color?: BulmaColor;

  /**
   * A Font Awesome icon name or an `icon:<key>` reference to the app’s icon registry.
   */
  readonly icon: IconReference;
  readonly iconSize?: IconSizeModifier;
  readonly size?: Exclude<BulmaSize, 'normal'>;
  readonly solid?: boolean;
}

export function Icon({
  color,
  className,
  icon,
  size,
  iconSize = getIconSizeModifier(size),
  solid = true,
  ...props
}: IconProps): ReactNode {
  const { getAssetUrl, registry } = useIconContext();
  const [failedUrl, setFailedUrl] = useState<string>();
  const resolved = resolveIcon(icon, registry, getAssetUrl);

  return (
    <span
      className={classNames('icon', size && `is-${size}`, className, {
        [`has-text-${color}`]: color && resolved.type !== 'asset',
      })}
      {...props}
    >
      {resolved.type === 'fontawesome' ? (
        <i className={classNames(fa(resolved.name, solid), iconSize && `fa-${iconSize}`)} />
      ) : null}
      {resolved.type === 'asset' && resolved.url !== failedUrl ? (
        // The error handler only tracks loading failures, it doesn’t make the image interactive.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <img
          alt=""
          className={styles.image}
          onError={() => setFailedUrl(resolved.url)}
          src={resolved.url}
        />
      ) : null}
    </span>
  );
}
