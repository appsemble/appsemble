import { BulmaColor, BulmaSize } from '@appsemble/types';
import { fa } from '@appsemble/web-utils';
import { IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { ComponentProps, ReactElement } from 'react';

interface IconProps extends ComponentProps<'span'> {
  color?: BulmaColor;
  icon: IconName;
  iconSize?: '2x' | '3x' | 'lg';
  size?: Exclude<BulmaSize, 'normal'>;
  solid?: boolean;
}

const iconSizeMap: { [size in IconProps['size']]: IconProps['iconSize'] } = {
  small: null,
  medium: 'lg',
  large: '2x',
};

export function Icon({
  color,
  className,
  icon,
  size,
  iconSize = iconSizeMap[size as 'large' | 'medium'],
  solid = true,
  ...props
}: IconProps): ReactElement {
  return (
    <span
      className={classNames('icon', size && `is-${size}`, className, {
        [`has-text-${color}`]: color,
      })}
      {...props}
    >
      <i className={classNames(fa(icon, solid), iconSize && `fa-${iconSize}`)} />
    </span>
  );
}
