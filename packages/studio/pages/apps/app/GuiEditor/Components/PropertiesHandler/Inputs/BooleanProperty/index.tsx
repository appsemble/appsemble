import { CheckboxField } from '@appsemble/react-components';
import { Schema } from 'jsonschema';
import { ChangeEvent, ReactElement, useCallback } from 'react';

interface BooleanPropertyProps {
  value: any;
  schema: Schema;
  property: string;
  onChange: (property: string, value: any) => void;
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
