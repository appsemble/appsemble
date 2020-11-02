import { MarkdownContent, SelectField } from '@appsemble/react-components';
import { OpenAPIV3 } from 'openapi-types';
import React, { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { JSONSchemaLabel } from '../JSONSchemaLabel';
import { CommonJSONSchemaEditorProps } from '../types';
import { messages } from './messages';

export function JSONSchemaEnumEditor({
  disabled,
  name,
  onChange,
  prefix,
  required,
  schema,
  value = '',
}: CommonJSONSchemaEditorProps<any>): ReactElement {
  return (
    <SelectField
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
    </SelectField>
  );
}
