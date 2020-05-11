import type { OpenAPIV3 } from 'openapi-types';
import * as React from 'react';

import type { NamedEvent } from '../../types';
import RecursiveJSONSchemaEditor from './components/RecursiveJSONSchemaEditor';

interface JSONSchemaEditorProps {
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
  name: string;

  /**
   * The handler that is called whenever a value changes.
   */
  onChange: (event: NamedEvent, value?: any) => void;

  /**
   * The schema used to render the form elements.
   */
  schema: OpenAPIV3.SchemaObject;

  /**
   * The value used to populate the editor.
   */
  value: any;
}

/**
 * Render a component for editing objects based on a JSON schema.
 */
export default function JSONSchemaEditor({
  disabled,
  name,
  onChange,
  schema,
  value,
}: JSONSchemaEditorProps): React.ReactElement {
  const handleChange = React.useCallback(
    (_event, val) => {
      onChange({ target: { name } }, val);
    },
    [name, onChange],
  );

  return (
    <RecursiveJSONSchemaEditor
      disabled={disabled}
      name={name}
      nested={false}
      onChange={handleChange}
      prefix={name}
      schema={schema}
      value={value}
    />
  );
}
