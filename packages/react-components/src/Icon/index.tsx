import type { BulmaSize } from '@appsemble/sdk';
import type { IconName, IconPrefix } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import React, { ReactElement } from 'react';

interface IconProps {
  className?: string;
  icon: IconName;
  iconSize?: 'lg' | '2x' | '3x';
  prefix?: IconPrefix;
  size?: Exclude<BulmaSize, 'normal'>;
}

const iconSizeMap: { [size in IconProps['size']]: IconProps['iconSize'] } = {
  small: null,
  medium: 'lg',
  large: '2x',
};

export function Icon({
  className,
  icon,
  prefix = 'fas',
  size,
  iconSize = iconSizeMap[size as 'medium' | 'large'],
}: IconProps): ReactElement {
  return (
    <span className={classNames('icon', size && `is-${size}`, className)}>
      <i className={classNames(prefix, `fa-${icon}`, iconSize && `fa-${iconSize}`)} />
    </span>
  );
}
