import { type IconReference } from '@appsemble/lang-sdk';
import { useBlock } from '@appsemble/preact';
import { type BulmaSize } from '@appsemble/types';
import { getIconSizeModifier, type IconSizeModifier } from '@appsemble/web-utils';
import classNames from 'classnames';
import { type VNode } from 'preact';
import { type ComponentPropsWithoutRef } from 'preact/compat';
import { useState } from 'preact/hooks';

import styles from './index.module.css';

interface IconProps extends Omit<ComponentPropsWithoutRef<'button'>, 'icon' | 'size'> {
  /**
   * The CSS class to apply to the icon.
   */
  readonly className?: string;

  /**
   * The element to render as the `.icon` wrapper.
   */
  readonly component?: 'button' | 'span';

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
  component: Component = 'span',
  icon,
  size,
  iconSize = getIconSizeModifier(size),
  ...props
}: IconProps): VNode {
  const {
    utils: { fa, resolveIcon },
  } = useBlock();
  const [failedUrl, setFailedUrl] = useState<string>();
  const resolved = resolveIcon(icon);

  return (
    <Component
      className={classNames('icon', size && `is-${size}`, className, {
        [styles.asset]: resolved.type === 'asset',
      })}
      {...props}
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
    </Component>
  );
}
