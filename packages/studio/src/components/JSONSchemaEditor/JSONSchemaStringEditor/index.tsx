import {
  DateTimeField,
  InputField,
  MarkdownContent,
  PasswordField,
} from '@appsemble/react-components';
import { OpenAPIV3 } from 'openapi-types';
import React, { ReactElement } from 'react';

import { JSONSchemaLabel } from '../JSONSchemaLabel';
import { CommonJSONSchemaEditorProps } from '../types';

export function JSONSchemaStringEditor({
  disabled,
  name,
  onChange,
  prefix,
  required,
  schema,
  value = '',
}: CommonJSONSchemaEditorProps<string>): ReactElement {
  const {
    description,
    example,
    format,
    maxLength,
    minLength,
    multipleOf,
  } = schema as OpenAPIV3.SchemaObject;

  const commonProps = {
    disabled,
    help: <MarkdownContent content={description} />,
    label: <JSONSchemaLabel name={name} prefix={prefix} schema={schema} />,
    maxLength,
    minLength,
    name,
    placeholder: example,
    required,
    step: multipleOf,
    value,
  };

  if (format === 'password') {
    return <PasswordField {...commonProps} onChange={onChange} />;
  }

  if (format === 'date-time') {
    return <DateTimeField {...commonProps} enableTime iso onChange={onChange} />;
  }

  return (
    <InputField {...commonProps} onChange={onChange} type={format === 'email' ? format : 'text'} />
  );
}
