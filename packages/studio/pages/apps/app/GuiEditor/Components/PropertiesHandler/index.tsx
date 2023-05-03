import { Schema } from 'jsonschema';
import { createContext, ReactElement, useCallback } from 'react';
import { JsonObject } from 'type-fest';

import RecursiveProperties from './RecursiveProperties/index.js';

export const SchemaDefinitionsContext = createContext({});

interface PropertiesHandlerProps {
  parameters: any;
  onChange: (newParameterDefinition: JsonObject) => void;
  schema: Schema;
}
export function PropertiesHandler({
  onChange,
  parameters,
  schema,
}: PropertiesHandlerProps): ReactElement {
  const onValueChange = useCallback(
    (property: string, newValue: JsonObject) => {
      onChange(newValue);
    },
    [onChange],
  );

  return (
    <div>
      <SchemaDefinitionsContext.Provider value={schema.definitions}>
        <RecursiveProperties
          onChange={onValueChange}
          property="parameters"
          schema={schema}
          value={parameters}
        />
      </SchemaDefinitionsContext.Provider>
    </div>
  );
}
export default PropertiesHandler;
