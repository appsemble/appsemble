import { Button } from '@appsemble/react-components';
import { type Schema } from 'jsonschema';
import { type OpenAPIV3 } from 'openapi-types';
import { type ReactElement, useCallback } from 'react';
import { type JsonObject } from 'type-fest';

import styles from './index.module.css';
import RecursiveProperties from '../../RecursiveProperties/index.js';

interface ArrayPropertyProps {
  value: any[];
  schema: Schema;
  property: string;
  onChange: (property: string, value: any) => void;
}

export function ArrayProperty({
  onChange,
  property,
  schema,
  value = [],
}: ArrayPropertyProps): ReactElement {
  const items = (schema as OpenAPIV3.ArraySchemaObject).items as OpenAPIV3.SchemaObject;
  const onValueChange = useCallback(
    (currentProperty: string, newValue: JsonObject) => {
      const index = Number(currentProperty.slice(property.length + 1));
      onChange(
        property,
        value.map((v, i) => (i === index ? newValue : v)),
      );
    },
    [onChange, property, value],
  );
  const onItemAdded = useCallback(() => {
    onChange(property, [
      {
        name: 'newItem',
        type: 'string',
        label: {
          translate: 'test',
        },
        multiline: false,
        placeholder: {
          translate: 'newItem',
        },
      },
      ...value,
    ]);
  }, [onChange, property, value]);
  // JSONSchemaArrayEditor;

  return (
    <div className={`${styles.root} px-3 py-3 my-2 mx-0`}>
      {value.map((item, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={index}>
          {/* eslint-disable-next-line react/no-array-index-key */}
          <div className="my-1" key={index}>
            <RecursiveProperties
              onChange={onValueChange}
              property={`${property}.${index}`}
              schema={items}
              value={item}
            />
            <div className="is-pulled-right">
              {value.length && index !== value.length - 1 ? (
                <Button className="mr-1" color="info" icon="arrows-alt-v" />
              ) : null}
              {schema.minItems == null || value.length > schema.minItems ? (
                <Button color="danger" icon="minus" />
              ) : null}
              {schema.maxItems == null || value.length < schema.maxItems ? (
                <Button className="ml-1" color="success" icon="plus" onClick={onItemAdded} />
              ) : null}
            </div>
          </div>
          <hr />
        </div>
      ))}
    </div>
  );
}

export default ArrayProperty;
