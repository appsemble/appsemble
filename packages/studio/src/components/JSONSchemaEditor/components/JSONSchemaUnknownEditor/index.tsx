import { JSONInput } from '@appsemble/react-components';
import * as React from 'react';

import type { CommonJSONSchemaEditorProps } from '../../types';
import JSONSchemaLabel from '../JSONSchemaLabel';

export default function JSONSchemaUnknownEditor({
  name,
  onChange,
  prefix,
  required,
  schema,
  value = null,
}: CommonJSONSchemaEditorProps<any>): React.ReactElement {
  return (
    <JSONInput
      help={schema.description}
      label={<JSONSchemaLabel name={name} prefix={prefix} schema={schema} />}
      name={name}
      onChange={onChange}
      required={required}
      value={value}
    />
  );
}
