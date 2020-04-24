import { Button, FormComponent } from '@appsemble/react-components';
import type { OpenAPIV3 } from 'openapi-types';
import * as React from 'react';
import type { Definition } from 'typescript-json-schema';

import JSONSchemaEditor from '../..';

interface JSONSchemaArrayEditorProps {
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
  schema: OpenAPIV3.SchemaObject | Definition;

  /**
   * The handler that is called whenever a value changes.
   */
  onChange: (name: any, value?: any) => void;

  /**
   * The label rendered above the input field.
   */
  label: string | React.ReactElement;
}

export default function JSONSchemaArrayEditor({
  label,
  name,
  onChange,
  required,
  schema,
}: JSONSchemaArrayEditorProps): React.ReactElement {
  const [arrayValue, setArrayValue] = React.useState([]);
  const arrayState: any = arrayValue;

  const onPropertyChange = React.useCallback(
    (event, val) => {
      const id = event.target.name.slice(name.length + 1);

      arrayState[id] = val;
      setArrayValue(arrayState);

      onChange(event, arrayState);
    },
    [onChange, name, arrayState],
  );

  const removeItem = React.useCallback(
    (event) => {
      const id = event.currentTarget.name.slice(name.length + 1);
      arrayState.splice(id, 1);
      setArrayValue(arrayState);
      onChange(event, arrayState);
    },
    [onChange, arrayState, name],
  );

  return (
    <div>
      <FormComponent label={label} required={required}>
        {arrayValue.map((val, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={index}>
            <JSONSchemaEditor
              // eslint-disable-next-line react/no-array-index-key
              key={`input.${index}`}
              name={`${name}.${index}`}
              onChange={onPropertyChange}
              schema={schema}
              value={val}
            />
            <Button
              // eslint-disable-next-line react/no-array-index-key
              key={`remove.${index}`}
              icon="trash"
              name={`${name}.${index}`}
              onClick={removeItem}
            />
          </div>
        ))}
        <Button icon="plus" name={name} onClick={() => setArrayValue([...arrayValue, undefined])} />
      </FormComponent>
    </div>
  );
}
