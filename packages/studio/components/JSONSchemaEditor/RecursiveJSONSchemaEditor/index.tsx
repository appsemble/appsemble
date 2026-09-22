import { type ReactNode, useCallback } from 'react';

import { JSONSchemaArrayEditor } from '../JSONSchemaArrayEditor/index.js';
import { JSONSchemaBooleanEditor } from '../JSONSchemaBooleanEditor/index.js';
import { JSONSchemaEnumEditor } from '../JSONSchemaEnumEditor/index.js';
import { JSONSchemaNumberEditor } from '../JSONSchemaNumberEditor/index.js';
import { JSONSchemaObjectEditor } from '../JSONSchemaObjectEditor/index.js';
import { JSONSchemaStringEditor } from '../JSONSchemaStringEditor/index.js';
import { JSONSchemaUnknownEditor } from '../JSONSchemaUnknownEditor/index.js';
import { type CommonJSONSchemaEditorProps, type JSONSchemaEditorEvent } from '../types.js';

export function RecursiveJSONSchemaEditor(props: CommonJSONSchemaEditorProps<any>): ReactNode {
  const { errors, onChange, path, schema } = props;
  const messages = errors
    ?.filter(
      (error) =>
        error.path.every((segment, index) => segment === path[index]) &&
        error.path.length === path.length,
    )
    .map((error) => error.message);
  const error = messages?.length ? (
    <>
      {messages.map((message) => (
        <span className="is-block" key={message}>
          {message}
        </span>
      ))}
    </>
  ) : undefined;
  const handleChange = useCallback(
    (event: JSONSchemaEditorEvent, value: any) => {
      onChange({ ...event, path: event.path ?? path }, value);
    },
    [onChange, path],
  );
  const editorProps = { ...props, error, onChange: handleChange };

  if (schema.enum) {
    return <JSONSchemaEnumEditor {...editorProps} />;
  }

  switch (schema.type) {
    case 'array':
      return <JSONSchemaArrayEditor {...editorProps} />;
    case 'boolean':
      return <JSONSchemaBooleanEditor {...editorProps} />;
    case 'object':
      return <JSONSchemaObjectEditor {...editorProps} />;
    case 'integer':
    case 'number':
      return <JSONSchemaNumberEditor {...editorProps} />;
    case 'string':
      return <JSONSchemaStringEditor {...editorProps} />;
    default:
      return <JSONSchemaUnknownEditor {...editorProps} />;
  }
}
