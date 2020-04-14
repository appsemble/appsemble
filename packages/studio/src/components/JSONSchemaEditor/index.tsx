import { Checkbox, Input, Select } from '@appsemble/react-components';
import type { OpenAPIV3 } from 'openapi-types';
import * as React from 'react';
import type { Definition } from 'typescript-json-schema';

interface JSONSchemaEditorProps {
  required?: boolean;
  schema: OpenAPIV3.SchemaObject | Definition;
  prop: OpenAPIV3.SchemaObject;
  propName: string;
  onChange: any;
  label: string | React.ReactElement;
  disabled: boolean;
}

export default function JSONSchemaEditor({
  disabled,
  label,
  onChange,
  prop,
  propName,
  required,
  schema,
}: JSONSchemaEditorProps): React.ReactElement {
  let type: React.ComponentPropsWithoutRef<typeof Input>['type'] = 'text';
  const returnElements: React.ReactElement[] = [];

  if (prop.type === 'integer' || prop.type === 'number') {
    type = 'number';
  } else if (prop.format === 'email') {
    type = 'email';
  } else if (prop.format === 'password') {
    type = 'password';
  }

  if (prop.enum) {
    return (
      <Select
        label={
          prop.title ? (
            <>
              {`${prop.title} `}
              <span className="has-text-weight-normal has-text-grey-light">({propName})</span>
            </>
          ) : (
            propName
          )
        }
        name={propName}
        onChange={onChange}
        required={schema?.required?.includes(propName)}
      >
        {prop.enum.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    );
  }

  switch (prop.type) {
    case 'boolean':
      return (
        <Checkbox
          help={propName}
          label={
            prop.title ? (
              <>
                {`${prop.title} `}
                <span className="has-text-weight-normal has-text-grey-light">({propName})</span>
              </>
            ) : (
              propName
            )
          }
          name={propName}
          onChange={onChange}
        />
      );
    case 'object':
      Object.entries(prop.properties).forEach(([key, object]) => {
        const objectProp = object as OpenAPIV3.SchemaObject;

        returnElements.push(
          <JSONSchemaEditor
            key={key}
            disabled={prop.readOnly || key === 'id'}
            label={
              prop.title ? (
                <>
                  {`${key} `}
                  <span className="has-text-weight-normal has-text-grey-light">({prop.title})</span>
                </>
              ) : (
                key
              )
            }
            onChange={(event: React.ChangeEvent<HTMLInputElement>, value: string) =>
              onChange(event, value, prop.type, propName)
            }
            prop={objectProp}
            propName={key}
            required={prop?.required?.includes(key)}
            schema={schema}
          />,
        );
      });

      return <div>{returnElements.map((element: any) => element)}</div>;
    case 'string':
    case 'number':
      return (
        <Input
          disabled={disabled}
          label={label}
          name={propName}
          onChange={(event, value) => {
            onChange(event, value, type);
          }}
          placeholder={prop.example}
          required={required}
          type={type}
        />
      );
    default:
      return null;
  }
}
