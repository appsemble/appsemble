import { Checkbox, Select, TextArea } from '@appsemble/react-components';
import type { OpenAPIV3 } from 'openapi-types';
import * as React from 'react';

import JSONSchemaArrayEditor from './components/JSONSchemaArrayEditor';
import JSONSchemaFileEditor from './components/JSONSchemaFileEditor';
import JSONSchemaObjectEditor from './components/JSONSchemaObjectEditor';
import JSONSchemaStringEditor from './components/JSONSchemaStringEditor';

interface JSONSchemaEditorProps {
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
  name?: string;

  /**
   * Whether or not the property is required.
   *
   * This is determined by the parent schema. It is used for recursion.
   */
  required?: boolean;

  /**
   * The schema used to render the form elements.
   */
  schema: OpenAPIV3.SchemaObject;

  /**
   * The handler that is called whenever a value changes.
   */
  onChange: (name: any, value?: any) => void;

  /**
   * The value used to populate the editor.
   */
  value: any;
}

export default function JSONSchemaEditor({
  disabled,
  name,
  onChange,
  required,
  schema,
  value,
}: JSONSchemaEditorProps): React.ReactElement {
  const label = schema?.title ? (
    <>
      {`${schema.title} `}
      <span className="has-text-weight-normal has-text-grey-light">({name})</span>
    </>
  ) : (
    name
  );
  const disable = disabled || schema.readOnly;

  if (schema.enum) {
    return (
      <Select label={label} name={name} onChange={onChange} required={required} value={value}>
        <option disabled hidden value="">
          {' '}
        </option>
        {schema.enum.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    );
  }

  if (schema.type === 'array') {
    if (schema?.items.hasOwnProperty('appsembleFile')) {
      return (
        <JSONSchemaFileEditor
          label={label}
          name={name}
          onChange={onChange}
          required={required}
          schema={schema}
        />
      );
    }
  }

  switch (schema.type) {
    case 'array':
      return (
        <JSONSchemaArrayEditor
          disabled={disabled}
          label={label}
          name={name}
          onChange={onChange}
          required={required}
          schema={schema}
          value={value || []}
        />
      );
    case 'boolean':
      return (
        <Checkbox
          disabled={disable}
          help={name}
          label={label}
          name={name}
          onChange={onChange}
          required={required}
        />
      );
    case 'object':
      return (
        <JSONSchemaObjectEditor
          disabled={disable}
          name={name}
          onChange={onChange}
          required={required}
          schema={schema}
          value={value || {}}
        />
      );
    case 'string':
    case 'number':
      return (
        <JSONSchemaStringEditor
          disabled={disable}
          label={label}
          name={name}
          onChange={onChange}
          required={required}
          schema={schema}
        />
      );
    default:
      return (
        <TextArea
          disabled={disabled}
          label={label}
          name={name}
          onChange={onChange}
          required={required}
          value={value}
        />
      );
  }
}
