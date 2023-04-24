import { Title, useMeta } from '@appsemble/react-components';
import { camelToHyphen, defaultLocale, schemas } from '@appsemble/utils';
import { type Schema as JSONSchema } from 'jsonschema';
import { type OpenAPIV3 } from 'openapi-types';
import { Fragment, type ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import Introduction from './introduction.md';
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

export function ActionPage(): ReactElement {
  useMeta(messages.title, messages.description);

  return (
    <main lang={defaultLocale}>
      <Title anchor className="pl-4" id="action-reference">
        <FormattedMessage {...messages.title} />
      </Title>
      <div className="pl-6">
        <Introduction main={false} />
        <Schema anchors renderRef={Ref} schema={base} />
      </div>
      {entries.map(([name, schema]) => {
        const id = camelToHyphen(name);

        return (
          <Fragment key={name}>
            <Title anchor className="pl-4 mb-1 mt-5" id={id} size={4}>
              {name}
            </Title>
            <div className="pl-6">
              <Schema anchors idPrefix={id} renderRef={Ref} schema={schema} />
            </div>
          </Fragment>
        );
      })}
    </main>
  );
}
