import { type IconReference } from '@appsemble/lang-sdk';
import { type BulmaColor, type BulmaSize } from '@appsemble/types';
import { fa, getIconSizeModifier, type IconSizeModifier, resolveIcon } from '@appsemble/web-utils';
import classNames from 'classnames';
import { type ComponentPropsWithoutRef, type ReactNode, useState } from 'react';

import styles from './index.module.css';
import { useIconContext } from '../IconProvider/index.js';

interface IconProps extends ComponentPropsWithoutRef<'button'> {
  readonly color?: BulmaColor;

  /**
   * The element to render as the `.icon` wrapper.
   */
  readonly component?: 'button' | 'span';

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
  component: Component = 'span',
  icon,
  size,
  iconSize = getIconSizeModifier(size),
  solid = true,
  ...props
}: IconProps): ReactNode {
  const { getAsset, registry } = useIconContext();
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const resolved = resolveIcon(icon, registry, getAsset);
  const src =
    resolved.type === 'asset'
      ? [resolved.url, resolved.fallbackUrl].find((url) => url && !failedUrls.includes(url))
      : undefined;

  return (
    <Component
      className={classNames('icon', size && `is-${size}`, className, {
        [styles.asset]: resolved.type === 'asset',
        [`has-text-${color}`]: color && resolved.type !== 'asset',
      })}
      {...props}
    >
      {resolved.type === 'fontawesome' ? (
        <i className={classNames(fa(resolved.name, solid), iconSize && `fa-${iconSize}`)} />
      ) : null}
      {src ? (
        // The error handler only tracks loading failures, it doesn’t make the image interactive.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <img
          alt=""
          className={styles.image}
          onError={() => setFailedUrls((urls) => [...urls, src])}
          src={src}
        />
      ) : null}
    </Component>
  );
}
