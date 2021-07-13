import { Checkbox, Title, useMeta, useToggle } from '@appsemble/react-components';
import { iterJSONSchema, schemas } from '@appsemble/utils';
import decamelize from 'decamelize';
import { safeDump } from 'js-yaml';
import { Schema as JSONSchema } from 'jsonschema';
import { Fragment, ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { CodeBlock } from '../../../components/CodeBlock';
import { HeaderControl } from '../../../components/HeaderControl';
import { Schema } from '../../../components/Schema';
import { messages } from './messages';
import { Ref } from './Ref';

const allSchemas = new Map<string, JSONSchema>();

function resolveJsonReferences(schema: JSONSchema, name: string): void {
  if (allSchemas.has(name)) {
    return;
  }
  allSchemas.set(name, schema);
  iterJSONSchema(schema, (subSchema) => {
    if (typeof subSchema.$ref === 'string') {
      const ref = subSchema.$ref.split('/').pop();
      if (ref in schemas) {
        resolveJsonReferences(schemas[ref as keyof typeof schemas], ref);
      }
    }
  });
}

resolveJsonReferences(schemas.AppDefinition, 'AppDefinition');

const entries = [...allSchemas.entries()];

export function AppPage(): ReactElement {
  useMeta(messages.title, messages.description);

  const showYaml = useToggle();

  return (
    <main>
      <HeaderControl
        className="pb-3"
        control={
          <Checkbox
            label={<FormattedMessage {...messages.showYaml} />}
            name="yaml"
            onChange={showYaml.toggle}
            switch
            value={showYaml.enabled}
          />
        }
      >
        <FormattedMessage {...messages.title} />
      </HeaderControl>
      {entries.map(([name, schema]) => (
        <Fragment key={name}>
          <Title id={decamelize(name, { separator: '-' })} size={4}>
            {name}
          </Title>
          {showYaml.enabled ? (
            <CodeBlock className="mb-5" language="yaml">
              {safeDump(schema)}
            </CodeBlock>
          ) : (
            <Schema renderRef={Ref} schema={schema} />
          )}
        </Fragment>
      ))}
    </main>
  );
}
