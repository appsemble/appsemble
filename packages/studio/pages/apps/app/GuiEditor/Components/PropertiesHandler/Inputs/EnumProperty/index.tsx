import { SelectField } from '@appsemble/react-components';
import { type Schema } from 'jsonschema';
import { type ChangeEvent, type ReactNode, useCallback } from 'react';
import { useIntl } from 'react-intl';

import { messages } from './messages.js';

interface EnumPropertyProps {
  readonly value: any;
  readonly schema: Schema;
  readonly onChange: (property: string, value: any) => void;
  readonly property: string;
}
export function EnumProperty({
  onChange,
  property,
  schema,
  value = '',
}: EnumPropertyProps): ReactNode {
  const { formatMessage } = useIntl();

  const onValueChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>, newValue: string) => {
      onChange(property, newValue);
    },
    [onChange, property],
  );

  return (
    <SelectField onChange={onValueChange} value={value}>
      {schema.enum.includes(value) ? null : (
        <option disabled value="">
          {formatMessage(messages.empty)}
        </option>
      )}
      {schema.enum.map((option, index) => (
        <option key={option} value={option}>
          {schema.enumDescriptions?.[index]
            ? `${schema.enumDescriptions[index]} (${option})`
            : option}
        </option>
      ))}
    </SelectField>
  );
}

export default EnumProperty;
