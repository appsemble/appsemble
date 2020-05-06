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
      const id = event.target.name.slice(name.length + 1);
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
          name={`${name}.${propName}`}
          onChange={onPropertyChange}
          required={required}
          schema={subSchema as OpenAPIV3.SchemaObject}
          value={value ? value[propName] : value}
        />
      ))}
    </div>
  );
}
