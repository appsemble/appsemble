import { generateDataFromSchema } from '@appsemble/lang-sdk';
import { SelectField } from '@appsemble/react-components';
import { type Schema, validate } from 'jsonschema';
import { type ChangeEvent, type ReactNode, useCallback, useContext, useState } from 'react';
import { type JsonObject } from 'type-fest';

import { SchemaDefinitionsContext } from '../../index.js';
import RecursiveProperties from '../../RecursiveProperties/index.js';

interface AnyOfPropertyProps {
  readonly value: any;
  readonly schema: Schema;
  readonly property: string;
  readonly onChange: (property: string, value: any) => void;
}

export function AnyOfProperty({
  onChange,
  property,
  schema,
  value,
}: AnyOfPropertyProps): ReactNode {
  const definitions = useContext(SchemaDefinitionsContext) as Record<string, Schema>;

  const resolveReferences = (schemaCheck: Schema): Schema => {
    if (schemaCheck?.$ref) {
      return resolveReferences(
        definitions[decodeURIComponent(schemaCheck.$ref.split('/').pop() as string)],
      );
    }
    if (schemaCheck?.anyOf) {
      const output = schemaCheck;
      output.anyOf = schemaCheck.anyOf.map((subSchema) => resolveReferences(subSchema));
      return output;
    }
    if (schemaCheck?.oneOf) {
      const output = schemaCheck;
      output.oneOf = schemaCheck.oneOf.map((subSchema) => resolveReferences(subSchema));
      return output;
    }
    if (schemaCheck?.allOf) {
      const output = schemaCheck;
      output.allOf = schemaCheck.allOf.map((subSchema) => resolveReferences(subSchema));
      return output;
    }
    return schemaCheck;
  };

  const checkKeys = (schemaValue: any, schemaCheck: Schema): boolean => {
    // Check type const if it exists
    if (schemaValue?.type !== schemaCheck?.properties?.type?.const) {
      return false;
    }
    // Check if the schemaValue has all the required keys of schemaCheck
    if (schemaValue && schemaCheck?.required) {
      for (const requiredKey of schemaCheck.required as string[]) {
        if (!schemaValue[requiredKey]) {
          return false;
        }
      }
    }
    // Check if all schemaValue keys exist in schemaCheck
    if (schemaValue && schemaCheck?.properties) {
      for (const key of Object.keys(schemaValue)) {
        if (!schemaCheck.properties?.[key]) {
          return false;
        }
      }
    }
    return true;
  };

  const findSchema = (schemaValue: Schema, schemaCheck: Schema): boolean => {
    if (schemaCheck?.anyOf) {
      return schemaCheck.anyOf.some((subSchema) => findSchema(schemaValue, subSchema));
    }
    if (schemaCheck?.oneOf) {
      return schemaCheck.oneOf.some((subSchema) => findSchema(schemaValue, subSchema));
    }
    if (schemaCheck?.allOf) {
      return schemaCheck.allOf.every((subSchema) => findSchema(schemaValue, subSchema));
    }
    if (schemaCheck?.$ref) {
      return findSchema(schemaValue, resolveReferences(schemaCheck));
    }
    if (typeof schemaValue === 'object') {
      return checkKeys(schemaValue, schemaCheck);
    }
    return validate(schemaValue, resolveReferences(schemaCheck)).valid;
  };
  const getSelectedIndex = (): number => {
    if (value && Object.keys(value).length > 0) {
      return schema.anyOf?.findIndex((subSchema) =>
        findSchema(value, resolveReferences(subSchema)),
      );
    }
    return -1;
  };

  const [currentSelected, setCurrentSelected] = useState(getSelectedIndex());

  const onValueChange = useCallback(
    (currentProperty: string, newValue: JsonObject) => {
      onChange(property, newValue);
    },
    [onChange, property],
  );

  const onTypeChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const index = Number(event.target.value);
      setCurrentSelected(index);
      if (index !== -1) {
        return;
      }
      onChange(property, generateDataFromSchema(schema.anyOf?.[index] ?? schema));
    },
    [onChange, property, schema],
  );

  return (
    <div>
      <SelectField onChange={onTypeChange} value={currentSelected}>
        <option value={-1}>Select Type</option>
        {schema.anyOf?.map((subSchema, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <option key={index} value={index}>
            {subSchema.type ?? subSchema.$ref.split('/').pop()}
          </option>
        ))}
      </SelectField>
      {currentSelected === -1 ? null : (
        <RecursiveProperties
          onChange={onValueChange}
          property={property}
          schema={schema.anyOf[currentSelected]}
          value={value}
        />
      )}
    </div>
  );
}

export default AnyOfProperty;
