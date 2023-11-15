import { InputField, TextAreaField } from '@appsemble/react-components';
import { type Schema } from 'jsonschema';
import { type OpenAPIV3 } from 'openapi-types';
import { type ChangeEvent, type ReactNode, useCallback } from 'react';

interface RemapperPropertyProps {
  readonly value: any;
  readonly schema: Schema;
  readonly onChange: (property: string, value: any) => void;
  readonly property: string;
}

export function RemapperProperty({
  onChange,
  property,
  schema,
  value,
}: RemapperPropertyProps): ReactNode {
  const { example, format, maxLength, minLength, multipleOf } = schema as OpenAPIV3.SchemaObject;
  const commonProps = {
    maxLength,
    minLength,
    placeholder: example,
    step: multipleOf,
    value,
  };
  const onValueChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, newValue: string) => {
      onChange(property, newValue);
    },
    [onChange, property],
  );

  if (schema.multiline) {
    return <TextAreaField {...commonProps} onChange={onValueChange} />;
  }

  return (
    <InputField
      {...commonProps}
      onChange={onValueChange}
      type={format === 'email' ? format : 'text'}
    />
  );
}

export default RemapperProperty;
