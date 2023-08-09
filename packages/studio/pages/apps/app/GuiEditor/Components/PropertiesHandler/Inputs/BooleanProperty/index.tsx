import { CheckboxField } from '@appsemble/react-components';
import { type Schema } from 'jsonschema';
import { type ChangeEvent, type ReactElement, useCallback } from 'react';

interface BooleanPropertyProps {
  readonly value: any;
  readonly schema: Schema;
  readonly property: string;
  readonly onChange: (property: string, value: any) => void;
}
export function BooleanProperty({
  onChange,
  property,
  schema,
  value = false,
}: BooleanPropertyProps): ReactElement {
  const onValueChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>, newValue: boolean) => {
      // eslint-disable-next-line no-console
      console.log(schema);
      onChange(property, newValue);
    },
    [onChange, property, schema],
  );

  return <CheckboxField name={property} onChange={onValueChange} value={value} />;
}

export default BooleanProperty;
