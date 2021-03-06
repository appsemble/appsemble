import { ReactElement, useCallback } from 'react';

import { RecursiveJSONSchemaEditor } from './RecursiveJSONSchemaEditor';
import { CommonJSONSchemaEditorProps } from './types';

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
    (event, val) => {
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
