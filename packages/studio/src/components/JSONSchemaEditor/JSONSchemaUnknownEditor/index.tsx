import { JSONField } from '@appsemble/react-components';
import { ReactElement } from 'react';

import { MarkdownContent } from '../../MarkdownContent';
import { JSONSchemaLabel } from '../JSONSchemaLabel';
import { CommonJSONSchemaEditorProps } from '../types';

export function JSONSchemaUnknownEditor({
  name,
  onChange,
  prefix,
  required,
  schema,
  value = null,
}: CommonJSONSchemaEditorProps<any>): ReactElement {
  return (
    <JSONField
      help={<MarkdownContent content={schema.description} />}
      label={<JSONSchemaLabel name={name} prefix={prefix} schema={schema} />}
      name={name}
      onChange={onChange}
      required={required}
      value={value}
    />
  );
}
