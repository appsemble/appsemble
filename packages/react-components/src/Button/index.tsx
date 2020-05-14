import type { BulmaColor } from '@appsemble/sdk';
import type { IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import * as React from 'react';

import Icon from '../Icon';

interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  color?: BulmaColor;
  icon?: IconName;
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
  type = 'button',
  ...props
}: ButtonProps): React.ReactElement {
  return (
    <button
      className={classNames('button', className, {
        [`is-${color}`]: color,
        'is-inverted': inverted,
        'is-loading': loading,
      })}
      // eslint-disable-next-line react/button-has-type
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
