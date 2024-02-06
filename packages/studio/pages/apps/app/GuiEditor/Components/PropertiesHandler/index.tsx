import { type Schema } from 'jsonschema';
import { createContext, type ReactNode, useCallback } from 'react';
import { type JsonObject } from 'type-fest';

import RecursiveProperties from './RecursiveProperties/index.js';

export const SchemaDefinitionsContext = createContext({});

interface PropertiesHandlerProps {
  readonly onChange: (newParameterDefinition: JsonObject) => void;
  readonly parameters: any;
  readonly schema: Schema;
}
export function PropertiesHandler({
  onChange,
  parameters,
  schema,
}: PropertiesHandlerProps): ReactNode {
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
