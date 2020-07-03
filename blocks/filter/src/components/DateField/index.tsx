import classNames from 'classnames';
import React, { ChangeEventHandler, ReactElement } from 'react';

interface DateFieldProps {
  className?: string;
  defaultValue?: any;
  id: string;
  loading: boolean;
  name: string;
  placeholder?: string;
  value?: string | number;
  onChange: ChangeEventHandler<HTMLElement>;
}

export default function DateField({ loading, value = '', ...props }: DateFieldProps): ReactElement {
  return (
    <div className={classNames('control', { 'is-loading': loading })}>
      <input className="input" type="date" value={value} {...props} />
    </div>
  );
}
