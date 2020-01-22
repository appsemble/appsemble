import { BulmaColor } from '@appsemble/types';
import { IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import * as React from 'react';

import Icon from '../Icon';

interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  color?: BulmaColor;
  icon?: IconName;
  loading?: boolean;
}

export default function Button({
  children,
  className,
  color,
  icon,
  loading,
  type = 'button',
  ...props
}: ButtonProps): React.ReactElement {
  return (
    // eslint-disable-next-line react/button-has-type
    <button
      className={classNames('button', className, {
        [`is-${color}`]: color,
        'is-loading': loading,
      })}
      type={type}
      {...props}
    >
      {icon ? (
        <>
          <Icon icon={icon} />
          {children && <span>{children}</span>}
        </>
      ) : (
        children
      )}
    </button>
  );
}
