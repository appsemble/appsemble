import { type BulmaColor, type BulmaSize } from '@appsemble/types';
import { fa } from '@appsemble/web-utils';
import { type IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { type ComponentProps, type ReactNode } from 'react';

interface IconProps extends ComponentProps<'span'> {
  readonly color?: BulmaColor;
  readonly icon: IconName;
  readonly iconSize?: '2x' | '3x' | 'lg';
  readonly size?: Exclude<BulmaSize, 'normal'>;
  readonly solid?: boolean;
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
}: IconProps): ReactNode {
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
