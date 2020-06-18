import * as React from 'react';

import RecursiveJSONSchemaEditor from './components/RecursiveJSONSchemaEditor';
import type { CommonJSONSchemaEditorProps } from './types';

/**
 * Render a component for editing objects based on a JSON schema.
 */
export default function JSONSchemaEditor({
  disabled,
  name,
  onChange,
  schema,
  value,
}: Pick<
  CommonJSONSchemaEditorProps<any>,
  'disabled' | 'name' | 'onChange' | 'schema' | 'value'
>): React.ReactElement {
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
