import { Checkbox, Select, TextArea } from '@appsemble/react-components';
import type { OpenAPIV3 } from 'openapi-types';
import * as React from 'react';

import JSONSchemaArrayEditor from './components/JSONSchemaArrayEditor';
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

  if (schema.enum) {
    return (
      <Select label={label} name={name} onChange={onChange} required={required} value={value || ''}>
        <option disabled hidden>
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

  switch (schema.type) {
    case 'array':
      return (
        <JSONSchemaArrayEditor
          disabled={disabled}
          label={label}
          name={name}
          onChange={onChange}
          required={required}
          schema={schema as OpenAPIV3.ArraySchemaObject}
          value={value}
        />
      );
    case 'boolean':
      return (
        <Checkbox
          disabled={disabled}
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
          disabled={disabled}
          name={name}
          onChange={onChange}
          required={required}
          schema={schema}
          value={value}
        />
      );
    case 'string':
    case 'integer':
    case 'number':
      return (
        <JSONSchemaStringEditor
          disabled={disabled}
          help={schema.description}
          label={label}
          max={schema.maximum ?? schema.exclusiveMaximum}
          min={schema.minimum ?? schema.exclusiveMinimum}
          name={name}
          onChange={onChange}
          required={required}
          schema={schema}
          step={schema.multipleOf}
          value={value}
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
          value={JSON.stringify(value)}
        />
      );
  }
}
