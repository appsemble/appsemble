import { forwardRef, ReactElement, useCallback } from 'react';

import { RecursiveJSONSchemaEditor } from './RecursiveJSONSchemaEditor';
import { CommonJSONSchemaEditorProps } from './types';

/**
 * Render a component for editing objects based on a JSON schema.
 */
export const JSONSchemaEditor = forwardRef<
  never,
  Pick<CommonJSONSchemaEditorProps<any>, 'disabled' | 'name' | 'onChange' | 'schema' | 'value'>
  // The ref is defined to suppress a React warning.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
>(({ disabled, name, onChange, schema, value }, ref): ReactElement => {
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
});
