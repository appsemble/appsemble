import classNames from 'classnames';
import React, { ChangeEventHandler, ReactElement } from 'react';

interface StringFieldProps {
  className?: string;
  defaultValue?: any;
  id?: string;
  loading: boolean;
  name: string;
  placeholder?: string;
  value?: any;
  onChange: ChangeEventHandler<HTMLElement>;
}

export default function StringField({
  className,
  loading,
  value = '',
  ...props
}: StringFieldProps): ReactElement {
  return (
    <div className={classNames('control', { 'is-loading': loading })}>
      <input className={classNames('input', className)} type="text" value={value} {...props} />
    </div>
  );
}
