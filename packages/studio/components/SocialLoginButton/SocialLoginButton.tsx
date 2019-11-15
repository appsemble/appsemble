import { Icon } from '@appsemble/react-components';
import { IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import React from 'react';

export interface SocialLoginButtonProps {
  className?: string;
  children: React.ReactChild;
  providerUri: string;
  iconClass: IconName;
}

export default class SocialLoginButton extends React.Component<SocialLoginButtonProps> {
  render(): JSX.Element {
    const { className, providerUri, iconClass, children, ...props } = this.props;

    return (
      <a className={classNames('button', className)} href={providerUri} {...props}>
        <Icon icon={iconClass} prefix="fab" />
        <span>{children}</span>
      </a>
    );
  }
}
