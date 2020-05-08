import type { OpenAPIV3 } from 'openapi-types';
import * as React from 'react';

import JSONSchemaEditor from '../..';

interface JSONSchemaObjectEditorProps {
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
   * The schema used to render the form elements.
   */
  schema: OpenAPIV3.SchemaObject;

  /**
   * The handler that is called whenever a value changes.
   */
  onChange: (event: React.SyntheticEvent, value?: { [key: string]: any }) => void;

  /**
   * The value used to populate the editor.
   */
  value: { [key: string]: any };
}

export default function JSONSchemaObjectEditor({
  disabled,
  name,
  onChange,
  required,
  schema,
  value = {},
}: JSONSchemaObjectEditorProps): React.ReactElement {
  const onPropertyChange = React.useCallback(
    (event, val) => {
      let id = '';
      if (name) {
        const splitId = event.currentTarget.name.slice(name.length + 1).split('.')[0];
        id = splitId;
      } else {
        const splitName = event.currentTarget.name.split('.')[0];
        id = splitName;
      }
      onChange(event, { ...value, [id]: val });
    },
    [name, onChange, value],
  );

  return (
    <div>
      {Object.entries(schema.properties).map(([propName, subSchema]) => (
        <JSONSchemaEditor
          key={propName}
          disabled={disabled}
          name={name ? `${name}.${propName}` : propName}
          onChange={onPropertyChange}
          required={required || (schema?.required ? schema?.required.includes(propName) : required)}
          schema={subSchema as OpenAPIV3.SchemaObject}
          value={value?.[propName]}
        />
      ))}
    </div>
  );
}
