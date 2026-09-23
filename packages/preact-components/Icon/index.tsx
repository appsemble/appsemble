import { type IconReference } from '@appsemble/lang-sdk';
import { useBlock } from '@appsemble/preact';
import { type BulmaSize } from '@appsemble/types';
import { getIconSizeModifier, type IconSizeModifier } from '@appsemble/web-utils';
import classNames from 'classnames';
import { type VNode } from 'preact';
import { useState } from 'preact/hooks';

import styles from './index.module.css';

interface IconProps {
  /**
   * The CSS class to apply to the icon.
   */
  readonly className?: string;

  /**
   * The name of the Font Awesome icon, or an `icon:<key>` reference to the app’s icon registry.
   */
  readonly icon: IconReference;

  /**
   * The size modifier for the icon.
   */
  readonly iconSize?: IconSizeModifier;

  /**
   * The size modifier for the container of the icon.
   */
  readonly size?: BulmaSize;
}

/**
 * Display a Font Awesome icon or a custom icon from the app’s icon registry.
 */
export function Icon({
  className,
  icon,
  size,
  iconSize = getIconSizeModifier(size),
}: IconProps): VNode {
  const {
    utils: { fa, resolveIcon },
  } = useBlock();
  const [failedUrl, setFailedUrl] = useState<string>();
  const resolved = resolveIcon(icon);

  return (
    <span
      className={classNames('icon', size && `is-${size}`, className, {
        [styles.asset]: resolved.type === 'asset',
      })}
    >
      {resolved.type === 'fontawesome' ? (
        <i className={classNames(fa(resolved.name), iconSize && `fa-${iconSize}`)} />
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
