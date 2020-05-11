import { Button, FormComponent } from '@appsemble/react-components';
import type { OpenAPIV3 } from 'openapi-types';
import * as React from 'react';

import JSONSchemaEditor from '../..';

interface JSONSchemaArrayEditorProps {
  /**
   * The name of the property thas is being rendered.
   *
   * The name is determined by the parent schema. It is used for recursion.
   */
  name?: string;

  /**
   * Whether or not the editor is disabled.
   *
   * This value is recursively passed down to all child inputs.
   */
  disabled?: boolean;

  /**
   * Whether or not the property is required.
   *
   * This is determined by the parent schema. It is used for recursion.
   */
  required?: boolean;

  /**
   * The schema used to render the form elements.
   */
  schema: OpenAPIV3.ArraySchemaObject;

  /**
   * The handler that is called whenever a value changes.
   */
  onChange: (event: React.SyntheticEvent, value?: any[]) => void;

  /**
   * The label rendered above the input field.
   */
  label: React.ReactNode;

  /**
   * The value used to populate the editor.
   */
  value: any[];
}

export default function JSONSchemaArrayEditor({
  disabled,
  label,
  name,
  onChange,
  required,
  schema,
  value = [],
}: JSONSchemaArrayEditorProps): React.ReactElement {
  const schemaItems = schema.items as OpenAPIV3.SchemaObject;

  const defaults: any = {
    array: [],
    boolean: false,
    object: {},
    number: 0,
    string: '',
  };
  const onPropertyChange = React.useCallback(
    (event, val) => {
      const slicedName = event.currentTarget.name.slice(name.length + 1).split('.')[0];
      const index = Number(slicedName);
      onChange(
        event,
        value.map((v, i) => (i === index ? val : v)),
      );
    },
    [onChange, name, value],
  );

  const removeItem = React.useCallback(
    (event) => {
      const index = Number(event.currentTarget.name.slice(name.length + 1));
      onChange(
        event,
        value.filter((_val, i) => i !== index),
      );
    },
    [onChange, name, value],
  );

  const onItemAdded = React.useCallback(
    (event: React.SyntheticEvent) => {
      onChange(event, [...value, schemaItems.default ?? defaults[schemaItems.type]]);
    },
    [onChange, value, defaults, schemaItems],
  );

  return (
    <div>
      <FormComponent label={label} required={required}>
        {value.map((val, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={index}>
            <JSONSchemaEditor
              disabled={disabled}
              name={`${name}.${index}`}
              onChange={onPropertyChange}
              schema={schema.items as OpenAPIV3.SchemaObject}
              value={val}
            />
            <Button icon="minus" name={`${name}.${index}`} onClick={removeItem} />
          </div>
        ))}
        <Button icon="plus" name={name} onClick={onItemAdded} />
      </FormComponent>
    </div>
  );
}
