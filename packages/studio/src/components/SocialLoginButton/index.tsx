import { Icon } from '@appsemble/react-components';
import type { IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import React from 'react';

interface SocialLoginButtonProps {
  className?: string;
  children: React.ReactChild;
  providerUri: string;
  iconClass: IconName;
}

export default function SocialLoginButton({
  children,
  className,
  iconClass,
  providerUri,
  ...props
}: SocialLoginButtonProps): React.ReactElement {
  return (
    <a className={classNames('button', className)} href={providerUri} {...props}>
      <Icon icon={iconClass} prefix="fab" />
      <span>{children}</span>
    </a>
  );
}
