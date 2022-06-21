import { useBlock } from '@appsemble/preact';
import { IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { VNode } from 'preact';

interface IconProps {
  /**
   * The CSS class to apply to the icon.
   */
  className?: string;

  /**
   * The name of the FontAwesome icon.
   */
  icon: IconName;

  /**
   * The size modifier for the icon.
   */
  iconSize?: '2x' | '3x' | 'lg';

  /**
   * The size modifier for the container of the icon.
   */
  size?: 'large' | 'medium' | 'small';
}

const iconSizeMap: { medium: 'lg'; large: '2x' } = { medium: 'lg', large: '2x' };

/**
 * Display a FontAwesome icon.
 */
export function Icon({
  className,
  icon,
  size,
  iconSize = iconSizeMap[size as 'large' | 'medium'],
}: IconProps): VNode {
  const {
    utils: { fa },
  } = useBlock();
  return (
    <span className={classNames('icon', size && `is-${size}`, className)}>
      <i className={classNames(fa(icon), iconSize && `fa-${iconSize}`)} />
    </span>
  );
}
