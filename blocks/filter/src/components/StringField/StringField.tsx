import classNames from 'classnames';
import React from 'react';

interface StringFieldProps {
  className?: string;
  defaultValue?: any;
  id?: string;
  loading: boolean;
  name: string;
  placeholder?: string;
  value?: any;
  onChange: React.ChangeEventHandler<HTMLElement>;
}

export default function StringField({
  loading,
  value = '',
  className,
  ...props
}: StringFieldProps): React.ReactElement {
  return (
    <div className={classNames('control', { 'is-loading': loading })}>
      <input className={classNames('input', className)} type="text" value={value} {...props} />
    </div>
  );
}
