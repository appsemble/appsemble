import { type Schema } from 'jsonschema';
import { type ReactNode, useCallback } from 'react';
import { type JsonObject } from 'type-fest';

import PropertyLabel from '../../PropertyLabel/index.js';
import RecursiveProperties from '../../RecursiveProperties/index.js';

interface ObjectPropertyProps {
  readonly value: JsonObject;
  readonly schema: Schema;
  readonly property: string;
  readonly onChange: (property: string, value: JsonObject) => void;
}
export function ObjectProperty({
  onChange,
  property,
  schema,
  value,
}: ObjectPropertyProps): ReactNode {
  const onValueChange = useCallback(
    (currentProperty: string, newValue: JsonObject) => {
      onChange(property, {
        ...value,
        [currentProperty]: newValue,
      });
    },
    [onChange, property, value],
  );

  return (
    <div>
      {Object.entries(schema?.properties ?? {}).map(([propName, subSchema]) => (
        <div key={propName}>
          <PropertyLabel
            description={subSchema.description}
            label={propName}
            required={
              typeof schema.required === 'boolean' ? false : schema.required?.includes(propName)
            }
          />
          <RecursiveProperties
            onChange={onValueChange}
            property={propName}
            schema={subSchema}
            value={value?.[propName]}
          />
        </div>
      ))}
    </div>
  );
}

export default ObjectProperty;
