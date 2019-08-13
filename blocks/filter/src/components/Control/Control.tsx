import classNames from 'classnames';
import React from 'react';

import { Enum } from '../../../types';

interface ControlProps {
  className?: string;
  defaultValue?: any;
  enum?: Enum[];
  emptyLabel?: string;
  id: string;
  loading: boolean;
  name: string;
  placeholder?: string;
  value?: any;
  onChange: React.ChangeEventHandler<HTMLElement>;
}

export default class Control extends React.Component<ControlProps> {
  static defaultProps: Partial<ControlProps> = {
    emptyLabel: '',
    defaultValue: undefined,
    enum: null,
    value: '',
  };

  render(): JSX.Element {
    const {
      enum: enumerator,
      defaultValue,
      loading,
      onChange,
      value,
      emptyLabel,
      ...props
    } = this.props;

    return (
      <div className={classNames('control', { 'is-loading': loading })}>
        {enumerator ? (
          <div className="select is-fullwidth">
            <select value={value} {...props}>
              {!defaultValue && <option label={emptyLabel} />}
              {enumerator.map(({ value: val, label }) => (
                <option key={val} value={val}>
                  {label || val}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <input className="input" value={value} {...props} />
        )}
      </div>
    );
  }
}
