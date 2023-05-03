import { InputField, TextAreaField } from '@appsemble/react-components';
import { Schema } from 'jsonschema';
import { OpenAPIV3 } from 'openapi-types';
import { ChangeEvent, ReactElement, useCallback } from 'react';

interface RemapperPropertyProps {
  value: any;
  schema: Schema;
  onChange: (property: string, value: any) => void;
  property: string;
}

export function RemapperProperty({
  onChange,
  property,
  schema,
  value,
}: RemapperPropertyProps): ReactElement {
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
