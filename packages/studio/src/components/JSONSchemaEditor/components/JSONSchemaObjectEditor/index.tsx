import type { OpenAPIV3 } from 'openapi-types';
import * as React from 'react';
import type { Definition } from 'typescript-json-schema';

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
  schema: OpenAPIV3.SchemaObject | Definition;

  /**
   * The handler that is called whenever a value changes.
   */
  onChange: (name: any, value?: any) => void;

  /**
   * The value used to populate the editor.
   */
  value: any;
}

export default function JSONSchemaObjectEditor({
  disabled,
  name,
  onChange,
  required,
  schema,
  value,
}: JSONSchemaObjectEditorProps): React.ReactElement {
  const [objectValue, setObjectValue] = React.useState({});
  const objectState: any = objectValue;

  const onPropertyChange = React.useCallback(
    (event, val) => {
      const id = event.target.name.slice(name.length + 1);

      setObjectValue({ ...objectValue, [id]: val });
      objectState[id] = val;
      onChange(event, objectState);
    },
    [onChange, objectValue, name.length, objectState],
  );

  return (
    <div>
      {Object.entries(schema.properties).map(([propName, subSchema]) => (
        <JSONSchemaEditor
          key={propName}
          disabled={disabled}
          name={`${name}.${propName}`}
          onChange={onPropertyChange}
          required={required || schema.required.includes(propName)}
          schema={subSchema}
          value={value ? value[propName] : value}
        />
      ))}
    </div>
  );
}
