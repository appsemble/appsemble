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
  prop: OpenAPIV3.SchemaObject;

  /**
   * The label rendered above the input field.
   */
  label: string | React.ReactElement;
}

export default function JSONSchemaStringEditor({
  disabled,
  label,
  name,
  onChange,
  prop,
  required,
}: JSONSchemaStringEditorProps): React.ReactElement {
  let type: React.ComponentPropsWithoutRef<typeof Input>['type'] = 'text';

  if (prop.type === 'integer' || prop.type === 'number') {
    type = 'number';
  } else if (prop.format === 'email') {
    type = 'email';
  } else if (prop.format === 'password') {
    type = 'password';
  } else if (prop.format === 'date-time') {
    type = 'date';
  }

  return (
    <div>
      <Input
        disabled={disabled}
        label={label}
        name={name}
        onChange={onChange}
        placeholder={prop.example}
        required={required}
        type={type}
      />
    </div>
  );
}
