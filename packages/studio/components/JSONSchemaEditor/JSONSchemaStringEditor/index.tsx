import {
  DateTimeField,
  FileUpload,
  InputField,
  PasswordField,
  TextAreaField,
} from '@appsemble/react-components';
import { OpenAPIV3 } from 'openapi-types';
import { ReactElement } from 'react';

import { MarkdownContent } from '../../MarkdownContent/index.js';
import { JSONSchemaLabel } from '../JSONSchemaLabel/index.js';
import { CommonJSONSchemaEditorProps } from '../types.js';

export function JSONSchemaStringEditor({
  disabled,
  name,
  onChange,
  prefix,
  required,
  schema,
  value = '',
}: CommonJSONSchemaEditorProps<string>): ReactElement {
  const { description, example, format, maxLength, minLength, multipleOf } =
    schema as OpenAPIV3.SchemaObject;

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

  if (schema.multiline) {
    return <TextAreaField {...commonProps} onChange={onChange} />;
  }

  if (format === 'password') {
    return <PasswordField {...commonProps} onChange={onChange} />;
  }

  if (format === 'date-time') {
    return <DateTimeField {...commonProps} enableTime iso onChange={onChange} />;
  }

  if (format === 'binary') {
    const blob = value as unknown as File | string;
    return (
      <FileUpload
        {...commonProps}
        fileLabel={typeof blob === 'string' ? blob : null}
        onChange={onChange as any}
        value={blob instanceof Blob ? blob : null}
      />
    );
  }

  return (
    <InputField {...commonProps} onChange={onChange} type={format === 'email' ? format : 'text'} />
  );
}
