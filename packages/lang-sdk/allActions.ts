import { schemas } from '@appsemble/lang-sdk';
import { type ActionDefinition } from '@appsemble/types';
import { type OpenAPIV3 } from 'openapi-types';

// Import { schemas } from './index.js';

type NonArraySchemaObject = OpenAPIV3.NonArraySchemaObject;
type ReferenceObject = OpenAPIV3.ReferenceObject;
type SchemaObject = OpenAPIV3.SchemaObject;

const [, kinds] = schemas.ActionDefinition.allOf as NonArraySchemaObject[];

export const allActions = new Set(
  (kinds.anyOf as ReferenceObject[])
    .map(({ $ref }) => {
      const ref = $ref.split('/').at(-1);
      const action = schemas[ref as keyof typeof schemas] as SchemaObject;
      const name = (action.properties?.type as SchemaObject).enum?.[0] as string | undefined;
      return name;
    })
    .filter((x) => x !== undefined),
);

export type ActionName = ActionDefinition['type'];
