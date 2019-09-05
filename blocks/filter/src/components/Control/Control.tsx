/** @jsx h */
import classNames from 'classnames';
import { h, VNode } from 'preact';

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
  onChange: (event: Event) => void;
}

export default function Control({
  defaultValue,
  enum: enumerator,
  emptyLabel = '',
  loading,
  onChange,
  value = '',
  ...props
}: ControlProps): VNode {
  return (
    <div className={classNames('control', { 'is-loading': loading })}>
      {enumerator ? (
        <div className="select is-fullwidth">
          <select onChange={onChange} value={value} {...props}>
            {!defaultValue && <option label={emptyLabel} />}
            {enumerator.map(({ value: val, label }) => (
              <option key={val} value={val}>
                {label || val}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input className="input" onInput={onChange} value={value} {...props} />
      )}
    </div>
  );
}
