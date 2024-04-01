import { Title, useMeta } from '@appsemble/react-components';
import { camelToHyphen, defaultLocale, schemas } from '@appsemble/utils';
import { type Schema as JSONSchema } from 'jsonschema';
import { type OpenAPIV3 } from 'openapi-types';
import { Fragment, type ReactNode } from 'react';

import { messages } from './messages.js';
import { Ref } from './Ref/index.js';
import { Schema } from '../../../../components/Schema/index.js';

const [base, definitions] = schemas.ActionDefinition.allOf;

const entries = (definitions as OpenAPIV3.NonArraySchemaObject).anyOf
  .map(({ $ref }: JSONSchema) => {
    const ref = $ref.split('/').pop();
    const schema = schemas[ref as keyof typeof schemas] as JSONSchema;

    return [
      schema.properties.type.enum[0],
      {
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
      },
    ];
  })
  .sort(([a], [b]) => a.localeCompare(b));

export function ActionPage(): ReactNode {
  useMeta(messages.title, messages.description);

  return (
    <main lang={defaultLocale}>
      <Schema anchors renderRef={Ref} schema={base} />
      {entries.map(([name, schema]) => {
        const id = camelToHyphen(name);

        return (
          <Fragment key={name}>
            <Title anchor className="mb-1 mt-5" id={id} size={4}>
              {name}
            </Title>
            <Schema anchors idPrefix={id} renderRef={Ref} schema={schema} />
          </Fragment>
        );
      })}
    </main>
  );
}
