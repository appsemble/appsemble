import { BulmaSize } from '@appsemble/sdk';
import { fa } from '@appsemble/web-utils';
import { IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { ComponentProps, ReactElement } from 'react';

interface IconProps extends ComponentProps<'span'> {
  icon: IconName;
  iconSize?: '2x' | '3x' | 'lg';
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
  size,
  iconSize = iconSizeMap[size as 'large' | 'medium'],
  ...props
}: IconProps): ReactElement {
  return (
    <span className={classNames('icon', size && `is-${size}`, className)} {...props}>
      <i className={classNames(fa(icon), iconSize && `fa-${iconSize}`)} />
    </span>
  );
}
