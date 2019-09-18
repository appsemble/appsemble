import React from 'react';

import { Enum } from '../../../types';

const EnumField: React.StatelessComponent<{
  value: any;
  defaultValue?: any;
  emptyLabel?: string;
  enumerator: Enum[];
  onChange: React.ChangeEventHandler<HTMLElement>;
}> = p => {
  const { defaultValue, emptyLabel, enumerator, value, ...props } = p;
  return (
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
  );
};

export default EnumField;
