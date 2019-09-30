import { Icon } from '@appsemble/react-components';
import React from 'react';

import { Enum } from '../../../types';

const CheckBoxField: React.StatelessComponent<{
  value: string[];
  enumerator: Enum[];
  onChange: React.ChangeEventHandler<HTMLElement>;
}> = p => {
  const { enumerator, value: parentValue, ...props } = p;
  return (
    <div>
      {enumerator.map(({ icon, value, label }) => (
        <label key={value}>
          <input checked={parentValue.includes(value)} type="checkbox" value={value} {...props} />
          {icon && <Icon icon={icon} />} {label || value}
        </label>
      ))}
    </div>
  );
};

export default CheckBoxField;
