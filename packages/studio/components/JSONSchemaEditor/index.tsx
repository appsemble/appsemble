import { forwardRef, type ReactNode, useCallback } from 'react';

import { RecursiveJSONSchemaEditor } from './RecursiveJSONSchemaEditor/index.js';
import { type CommonJSONSchemaEditorProps, type JSONSchemaEditorEvent } from './types.js';

/**
 * Render a component for editing objects based on a JSON schema.
 */
export const JSONSchemaEditor = forwardRef<
  never,
  Pick<
    CommonJSONSchemaEditorProps<any>,
    'disabled' | 'errors' | 'name' | 'onChange' | 'onFieldChange' | 'schema' | 'value'
  >
  // The ref is defined to suppress a React warning.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
>(({ disabled, errors, name, onChange, onFieldChange, schema, value }, ref): ReactNode => {
  const handleChange = useCallback(
    (event: JSONSchemaEditorEvent, val: string) => {
      onFieldChange?.(event.path ?? []);
      onChange({ currentTarget: { name } }, val);
    },
    [name, onChange, onFieldChange],
  );

  return (
    <RecursiveJSONSchemaEditor
      disabled={disabled}
      errors={errors}
      name={name}
      nested={false}
      onChange={handleChange}
      path={[]}
      prefix={name}
      schema={schema}
      value={value}
    />
  );
});
