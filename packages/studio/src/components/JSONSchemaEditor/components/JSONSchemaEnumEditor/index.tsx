import { Select } from '@appsemble/react-components';
import type { OpenAPIV3 } from 'openapi-types';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';

import JSONSchemaLabel from '../JSONSchemaLabel';
import messages from './messages';

interface JSONSchemaEnumEditorProps {
  /**
   * Whether or not the editor is disabled.
   *
   * This value is recursively passed down to all child inputs.
   */
  disabled?: boolean;

  /**
   * The name of the property thas is being rendered.
   *
   * The name is determined by the parent schema. It is used for recursion.
   */
  name: string;

  /**
   * The handler that is called whenever a value changes.
   */
  onChange: (name: any, value?: any) => void;

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
  value: any;
}

export default function JSONSchemaEnumEditor({
  disabled,
  name,
  onChange,
  prefix,
  required,
  schema,
  value = '',
}: JSONSchemaEnumEditorProps): React.ReactElement {
  return (
    <Select
      disabled={disabled}
      label={<JSONSchemaLabel name={name} prefix={prefix} schema={schema} />}
      name={name}
      onChange={onChange}
      required={required}
      value={value}
    >
      <option disabled hidden>
        <FormattedMessage {...messages.empty} />
      </option>
      {schema.enum.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </Select>
  );
}
