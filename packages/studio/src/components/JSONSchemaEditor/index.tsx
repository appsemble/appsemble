import React, { ReactElement, useCallback } from 'react';

import { RecursiveJSONSchemaEditor } from './components/RecursiveJSONSchemaEditor';
import type { CommonJSONSchemaEditorProps } from './types';

/**
 * Render a component for editing objects based on a JSON schema.
 */
export function JSONSchemaEditor({
  disabled,
  name,
  onChange,
  schema,
  value,
}: Pick<
  CommonJSONSchemaEditorProps<any>,
  'disabled' | 'name' | 'onChange' | 'schema' | 'value'
>): ReactElement {
  const handleChange = useCallback(
    (_event, val) => {
      onChange({ currentTarget: { name } }, val);
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
