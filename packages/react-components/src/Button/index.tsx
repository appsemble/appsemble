import type { BulmaColor } from '@appsemble/sdk';
import type { IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import * as React from 'react';

import Icon from '../Icon';

interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  color?: BulmaColor;
  icon?: IconName;
  rightIcon?: IconName;
  inverted?: boolean;
  loading?: boolean;
}

export default function Button({
  children,
  className,
  color,
  icon,
  inverted,
  loading,
  rightIcon,
  type = 'button',
  ...props
}: ButtonProps): React.ReactElement {
  return (
    // eslint-disable-next-line react/button-has-type
    <button
      className={classNames('button', className, {
        [`is-${color}`]: color,
        'is-inverted': inverted,
        'is-loading': loading,
      })}
      type={type}
      {...props}
    >
      {icon || rightIcon ? (
        <>
          {icon ? <Icon icon={icon} /> : null}
          {children && <span>{children}</span>}
          {rightIcon ? <Icon icon={rightIcon} /> : null}
        </>
      ) : (
        children
      )}
    </button>
  );
}
