import { camelToHyphen, defaultLocale } from '@appsemble/utils';
import { type Schema as JSONSchema } from 'jsonschema';
import { type OpenAPIV3 } from 'openapi-types';
import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { type RenderRefProps, Schema } from '../../../../components/Schema/index.js';

interface ActionRefProps {
  readonly action: OpenAPIV3.SchemaObject;
  readonly excludeBase?: boolean;
}

function Ref({ isArray, jsonRef }: RenderRefProps): ReactNode {
  const name = jsonRef.split('/').pop();

  return (
    <>
      {name === 'ActionDefinition' ? (
        'ActionDefinition'
      ) : (
        <Link
          // TODO: app url thing is questionable
          to={name === 'RemapperDefinition' ? '../../remappers' : `./app#${camelToHyphen(name)}`}
        >
          {name}
        </Link>
      )}
      {isArray ? '[]' : null}
    </>
  );
}

export function ActionRef({ action, excludeBase = true }: ActionRefProps): ReactNode {
  const schema = action as JSONSchema;

  const entry = excludeBase
    ? {
        ...schema,
        description: schema.properties.type.description,
        properties: Object.fromEntries(
          Object.entries(schema.properties).filter(
            ([prop]) =>
              prop !== 'onError' &&
              prop !== 'onSuccess' &&
              prop !== 'remapAfter' &&
              prop !== 'remapBefore' &&
              prop !== 'type',
          ),
        ),
      }
    : schema;

  return (
    <main className="mb-4" lang={defaultLocale}>
      <Schema anchors idPrefix="app" renderRef={Ref} schema={entry} />
    </main>
  );
}
