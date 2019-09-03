/** @jsx h */
import { IconName, IconPrefix } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { Component, h, VNode } from 'preact';

interface IconProps {
  className?: string;
  icon: IconName;
  iconSize?: 'lg' | '2x' | '3x';
  prefix?: IconPrefix;
  size?: 'small' | 'medium' | 'large';
}

const iconSizeMap = { medium: 'lg', large: '2x' };

export default class Icon extends Component<IconProps> {
  render(): VNode {
    const {
      className,
      icon,
      prefix = 'fas',
      size,
      iconSize = iconSizeMap[size as 'medium' | 'large'],
    } = this.props;

    return (
      <span className={classNames('icon', size && `is-${size}`, className)}>
        <i className={classNames(prefix, `fa-${icon}`, iconSize && `fa-${iconSize}`)} />
      </span>
    );
  }
}
