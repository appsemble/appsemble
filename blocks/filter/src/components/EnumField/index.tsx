import React, { ChangeEventHandler, ReactElement } from 'react';

import type { Enum } from '../../../block';

interface EnumFieldProps {
  value: any;
  defaultValue?: any;
  emptyLabel?: string;
  enumerator: Enum[];
  onChange: ChangeEventHandler<HTMLElement>;
}

export default function EnumField({
  defaultValue,
  emptyLabel,
  enumerator,
  value,
  ...props
}: EnumFieldProps): ReactElement {
  return (
    <div className="select is-fullwidth">
      <select value={value} {...props}>
        {!defaultValue && <option label={emptyLabel} />}
        {enumerator.map(({ label, value: val }) => (
          <option key={val} value={val}>
            {label ?? val}
          </option>
        ))}
      </select>
    </div>
  );
}
