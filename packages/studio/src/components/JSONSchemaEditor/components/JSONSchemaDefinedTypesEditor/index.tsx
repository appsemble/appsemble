import { Button, FormComponent } from '@appsemble/react-components';
import type { OpenAPIV3 } from 'openapi-types';
import * as React from 'react';
import type { Definition } from 'typescript-json-schema';

// TODO import JSONSchemaObjectEditor from '../../components/JSONSchemaObjectEditor';
import JSONSchemaEditor from '../JSONSchemaObjectEditor';

interface JSONSchemaDefinedTypesEditorProps {
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

  /**
   * The name of a defined definition
   */
  definitions: OpenAPIV3.SchemaObject[];

  /**
   * The value used to populate the editor.
   */
  value: any;
}

export default function JSONSchemaDefinedTypesEditor({
  definitions,
  label,
  name,
  onChange,
  required,
  schema,
  value,
}: JSONSchemaDefinedTypesEditorProps): React.ReactElement {
  const [activeDefinitions, setActiveDefinitions] = React.useState<OpenAPIV3.SchemaObject[]>([]);
  const [refValues, setRefValues] = React.useState([]);
  const [objectValue, setObjectValue] = React.useState({});
  const objectState: any = objectValue;

  function getDefinitionNameFromRef(ref: string): any {
    const array = ref.split('/');
    return array[array.length - 1];
  }

  const addItem = React.useCallback(
    (event: any) => {
      Object.entries(definitions).map((val: [string, OpenAPIV3.SchemaObject]) => {
        if (val[0] === event.currentTarget.name) {
          setActiveDefinitions([...activeDefinitions, val[1]]);
          setObjectValue([...refValues, val[0]]);
        }
        return undefined;
      });
    },
    [refValues, activeDefinitions, definitions],
  );

  const removeItem = React.useCallback(
    (event) => {
      const id = event.currentTarget.name.slice(name.length + 1);
      objectState.splice(id, 1);
      setRefValues(objectState);
      onChange(event, objectState);
    },
    [onChange, objectState, name],
  );

  return (
    <div>
      <FormComponent label={label} required={required}>
        <div className="box">
          {Object.entries(schema.anyOf).map((key: [string, any], index: number) => (
            <Button
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              icon="plus"
              name={getDefinitionNameFromRef(key[1].$ref)}
              onClick={(event) => addItem(event)}
            >
              {getDefinitionNameFromRef(key[1].$ref)}
            </Button>
          ))}
        </div>
        {refValues.map((refName, index: number) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={index} className="container">
            <JSONSchemaEditor
              key={`input.${refName}`}
              name={refName}
              onChange={onChange}
              schema={activeDefinitions[index]}
              value={value ? value[refName] : value}
            />
            <Button
              // eslint-disable-next-line react/no-array-index-key
              key={`remove.${index}`}
              icon="minus"
              name={`${refName}.${index}`}
              onClick={removeItem}
            />
          </div>
        ))}
      </FormComponent>
    </div>
  );
}
