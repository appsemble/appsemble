import { TextArea } from '@appsemble/react-components';
import type { OpenAPIV3 } from 'openapi-types';
import * as React from 'react';

import JSONSchemaLabel from '../JSONSchemaLabel';

interface JSONSchemaUnknownEditorProps {
  /**
   * The name of the property thas is being rendered.
   *
   * The name is determined by the parent schema. It is used for recursion.
   */
  name: string;

  /**
   * The prefix to remove from labels.
   */
  prefix: string;

  /**
   * Whether or not the property is required.
   *
   * This is determined by the parent schema. It is used for recursion.
   */
  required?: boolean;

  /**
   * The properties of the schema object.
   */
  schema: OpenAPIV3.SchemaObject;

  /**
   * The value used to populate the editor.
   */
  value: string;
}

export default function JSONSchemaUnknownEditor({
  name,
  prefix,
  required,
  schema,
  value = '',
}: JSONSchemaUnknownEditorProps): React.ReactElement {
  return (
    <TextArea
      disabled
      label={<JSONSchemaLabel name={name} prefix={prefix} schema={schema} />}
      name={name}
      onChange={null}
      readOnly
      required={required}
      value={JSON.stringify(value, undefined, 2)}
    />
  );
}
