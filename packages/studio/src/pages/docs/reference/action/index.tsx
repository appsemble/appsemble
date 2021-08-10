import { Title, useMeta } from '@appsemble/react-components';
import { BaseActionDefinition, defaultLocale, schemas } from '@appsemble/utils';
import decamelize from 'decamelize';
import { Schema as JSONSchema } from 'jsonschema';
import { Fragment, ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { Schema } from '../../../../components/Schema';
import Introduction from './introduction.md';
import { messages } from './messages';
import { Ref } from './Ref';

const entries = schemas.ActionDefinition.oneOf
  .map<[string, JSONSchema]>(({ $ref }: JSONSchema) => {
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
              prop !== 'type' && prop !== 'remap' && prop !== 'onSuccess' && prop !== 'onError',
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
        <Schema anchors renderRef={Ref} schema={BaseActionDefinition} />
      </div>
      {entries.map(([name, schema]) => {
        const id = decamelize(name, { separator: '-' });

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
