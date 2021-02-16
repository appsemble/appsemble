import { BulmaSize } from '@appsemble/sdk';
import { IconName, IconPrefix } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { ComponentProps, ReactElement } from 'react';

interface IconProps extends ComponentProps<'span'> {
  className?: string;
  icon: IconName;
  iconSize?: '2x' | '3x' | 'lg';
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
  iconSize = iconSizeMap[size as 'large' | 'medium'],
  ...props
}: IconProps): ReactElement {
  return (
    <span className={classNames('icon', size && `is-${size}`, className)} {...props}>
      <i className={classNames(prefix, `fa-${icon}`, iconSize && `fa-${iconSize}`)} />
    </span>
  );
}
