import classNames from 'classnames';
import React from 'react';

interface DateFieldProps {
  className?: string;
  defaultValue?: any;
  id: string;
  loading: boolean;
  name: string;
  placeholder?: string;
  value?: string | number;
  onChange: React.ChangeEventHandler<HTMLElement>;
}

export default class DateField extends React.Component<DateFieldProps> {
  static defaultProps: Partial<DateFieldProps> = {
    value: '',
  };

  render(): JSX.Element {
    const { loading, value, ...props } = this.props;

    return (
      <div className={classNames('control', { 'is-loading': loading })}>
        <input className="input" type="date" value={value} {...props} />{' '}
      </div>
    );
  }
}
