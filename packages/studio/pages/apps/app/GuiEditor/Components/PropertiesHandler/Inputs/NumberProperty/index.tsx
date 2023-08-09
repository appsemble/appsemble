import { InputField } from '@appsemble/react-components';
import { type Schema } from 'jsonschema';
import { type OpenAPIV3 } from 'openapi-types';
import { type ChangeEvent, type ReactElement, useCallback } from 'react';

interface NumberPropertyProps {
  readonly value: any;
  readonly schema: Schema;
  readonly property: string;
  readonly onChange: (property: string, value: any) => void;
}
export function NumberProperty({
  onChange,
  property,
  schema,
  value,
}: NumberPropertyProps): ReactElement {
  const onValueChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>, newValue: number) => {
      onChange(property, newValue);
    },
    [onChange, property],
  );

  return (
    <div>
      <InputField
        max={schema.maximum}
        min={schema.minimum}
        onChange={onValueChange}
        placeholder={(schema as OpenAPIV3.SchemaObject).example}
        step={schema.multipleOf || schema.type === 'integer' ? 1 : undefined}
        type="number"
        value={value}
      />
    </div>
  );
}

export default NumberProperty;
