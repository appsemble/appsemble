import { Input } from '@appsemble/react-components';
import type { OpenAPIV3 } from 'openapi-types';
import * as React from 'react';

import type { CommonJSONSchemaEditorProps } from '../../types';
import JSONSchemaLabel from '../JSONSchemaLabel';

export default function JSONSchemaStringEditor({
  disabled,
  name,
  onChange,
  prefix,
  required,
  schema,
  value = '',
}: CommonJSONSchemaEditorProps<number | string>): React.ReactElement {
  let type: React.ComponentPropsWithoutRef<typeof Input>['type'] = 'text';

  if (schema.type === 'integer' || schema.type === 'number') {
    type = 'number';
  } else if (schema.format === 'email') {
    type = 'email';
  } else if (schema.format === 'password') {
    type = 'password';
  } else if (schema.format === 'date') {
    type = 'date';
  } else if (schema.format === 'date-time') {
    type = 'datetime-local';
  }

  return (
    <Input
      disabled={disabled}
      help={schema.description}
      label={<JSONSchemaLabel name={name} prefix={prefix} schema={schema} />}
      max={schema.maximum}
      maxLength={schema.maxLength}
      min={schema.minimum}
      minLength={schema.minLength}
      name={name}
      onChange={onChange}
      placeholder={(schema as OpenAPIV3.SchemaObject).example}
      required={required}
      step={schema.multipleOf}
      type={type}
      value={value}
    />
  );
}
