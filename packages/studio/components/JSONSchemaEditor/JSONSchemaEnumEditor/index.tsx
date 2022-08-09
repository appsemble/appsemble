import { SelectField } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { useIntl } from 'react-intl';

import { MarkdownContent } from '../../MarkdownContent/index.js';
import { JSONSchemaLabel } from '../JSONSchemaLabel/index.js';
import { CommonJSONSchemaEditorProps } from '../types.js';
import { messages } from './messages.js';

export function JSONSchemaEnumEditor({
  disabled,
  name,
  onChange,
  prefix,
  required,
  schema,
  value = '',
}: CommonJSONSchemaEditorProps<any>): ReactElement {
  const { formatMessage } = useIntl();

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
      {schema.enum.includes(value) ? null : (
        <option disabled value="">
          {formatMessage(messages.empty)}
        </option>
      )}
      {schema.enum.map((option, index) => (
        <option key={option} value={option}>
          {schema.enumDescriptions?.[index]
            ? `${schema.enumDescriptions[index]} (${option})`
            : option}
        </option>
      ))}
    </SelectField>
  );
}
