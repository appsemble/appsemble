import { Input } from '@appsemble/react-components';
import type { OpenAPIV3 } from 'openapi-types';
import * as React from 'react';

interface JSONSchemaStringEditorProps {
  /**
   * Whether or not the editor is disabled.
   *
   * This value is recursively passed down to all child inputs.
   */
  disabled?: boolean;

  /**
   * The name of the property thas is being rendered.
   *
   * The name is determined by the parent schema. It is used for recursion.
   */
  name?: string;

  /**
   * Whether or not the property is required.
   *
   * This is determined by the parent schema. It is used for recursion.
   */
  required?: boolean;

  /**
   * The handler that is called whenever a value changes.
   */
  onChange: (name: any, value?: any) => void;

  /**
   * The properties of the schema object.
   */
  schema: OpenAPIV3.SchemaObject;

  /**
   * The label rendered above the input field.
   */
  label: string | React.ReactElement;

  /**
   * The value used to populate the editor.
   */
  value: string;

  /**
   * The help prompt rendered underneath the field.
   */
  help: string;

  /**
   * The max length indicator rendered at the bottom right of the field.
   */
  max: number | boolean;
  /**
   * The min length indicator rendered at the bottom right of the field.
   */
  min: number | boolean;

  step: number;
}

export default function JSONSchemaStringEditor({
  disabled,
  help,
  label,
  max,
  min,
  name,
  onChange,
  required,
  schema,
  step,
  value,
}: JSONSchemaStringEditorProps): React.ReactElement {
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
    <div>
      <Input
        disabled={disabled}
        help={help}
        label={label}
        maxLength={max as number}
        minLength={min as number}
        name={name}
        onChange={onChange}
        placeholder={schema.example}
        required={required}
        step={step}
        type={type}
        value={value}
      />
    </div>
  );
}
