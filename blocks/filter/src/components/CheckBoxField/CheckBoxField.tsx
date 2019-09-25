import { Icon } from '@appsemble/react-components';
import React from 'react';

import { CheckBoxFilter, Enum } from '../../../types';

const CheckBoxField: React.StatelessComponent<{
  value: CheckBoxFilter;
  enumerator: Enum[];
  onChange: React.ChangeEventHandler<HTMLElement>;
}> = p => {
  const { enumerator, value: parentValue, ...props } = p;
  return (
    <div>
      {enumerator.map(({ icon, value, label }) => (
        <label key={value}>
          <input
            checked={parentValue && parentValue[value] !== undefined}
            type="checkbox"
            value={value}
            {...props}
          />
          {icon && <Icon icon={icon} />} {label || value}
        </label>
      ))}
    </div>
  );
};

export default CheckBoxField;
