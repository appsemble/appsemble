import { type NamedEvent } from '@appsemble/web-utils';
import { forwardRef, type ReactNode, useCallback } from 'react';

import { RecursiveJSONSchemaEditor } from './RecursiveJSONSchemaEditor/index.js';
import { type CommonJSONSchemaEditorProps } from './types.js';

/**
 * Render a component for editing objects based on a JSON schema.
 */
export const JSONSchemaEditor = forwardRef<
  never,
  Pick<CommonJSONSchemaEditorProps<any>, 'disabled' | 'name' | 'onChange' | 'schema' | 'value'>
  // The ref is defined to suppress a React warning.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
>(({ disabled, name, onChange, schema, value }, ref): ReactNode => {
  const handleChange = useCallback(
    (event: NamedEvent, val: string) => {
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
