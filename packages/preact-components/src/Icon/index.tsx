import { fa } from '@appsemble/web-utils';
import { IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { VNode } from 'preact';

interface IconProps {
  className?: string;
  icon: IconName;
  iconSize?: '2x' | '3x' | 'lg';
  size?: 'large' | 'medium' | 'small';
}

const iconSizeMap: { medium: 'lg'; large: '2x' } = { medium: 'lg', large: '2x' };

export function Icon({
  className,
  icon,
  size,
  iconSize = iconSizeMap[size as 'large' | 'medium'],
}: IconProps): VNode {
  return (
    <span className={classNames('icon', size && `is-${size}`, className)}>
      <i className={classNames(fa(icon), iconSize && `fa-${iconSize}`)} />
    </span>
  );
}
