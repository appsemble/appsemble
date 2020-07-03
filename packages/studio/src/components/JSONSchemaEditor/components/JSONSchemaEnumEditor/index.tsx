import { MarkdownContent, Select } from '@appsemble/react-components';
import type { OpenAPIV3 } from 'openapi-types';
import React, { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import type { CommonJSONSchemaEditorProps } from '../../types';
import JSONSchemaLabel from '../JSONSchemaLabel';
import messages from './messages';

export default function JSONSchemaEnumEditor({
  disabled,
  name,
  onChange,
  prefix,
  required,
  schema,
  value = '',
}: CommonJSONSchemaEditorProps<any>): ReactElement {
  return (
    <Select
      disabled={disabled}
      help={<MarkdownContent content={schema.description} />}
      label={<JSONSchemaLabel name={name} prefix={prefix} schema={schema} />}
      name={name}
      onChange={onChange}
      required={required}
      value={value}
    >
      <option disabled hidden>
        <FormattedMessage {...messages.empty} />
      </option>
      {(schema as OpenAPIV3.SchemaObject).enum.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </Select>
  );
}
