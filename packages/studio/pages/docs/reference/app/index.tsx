import { Checkbox, Title, useMeta, useToggle } from '@appsemble/react-components';
import { camelToHyphen, defaultLocale, iterJSONSchema, schemas } from '@appsemble/utils';
import { Schema as JSONSchema } from 'jsonschema';
import { Fragment, ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { stringify } from 'yaml';

import { CodeBlock } from '../../../../components/CodeBlock';
import { HeaderControl } from '../../../../components/HeaderControl';
import { Schema } from '../../../../components/Schema';
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
      if (ref in schemas && ref !== 'ActionDefinition' && ref !== 'RemapperDefinition') {
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
    <main lang={defaultLocale}>
      <HeaderControl
        anchor
        className="pb-3 pl-4"
        control={
          <Checkbox
            label={<FormattedMessage {...messages.showYaml} />}
            name="yaml"
            onChange={showYaml.toggle}
            switch
            value={showYaml.enabled}
          />
        }
        id="app-reference"
      >
        <FormattedMessage {...messages.title} />
      </HeaderControl>
      {entries.map(([name, schema]) => {
        const id = camelToHyphen(name);

        return (
          <Fragment key={name}>
            <Title anchor className="pl-4" id={id} size={4}>
              {name}
            </Title>
            <div className="pl-6">
              {showYaml.enabled ? (
                <CodeBlock className="mb-5" language="yaml">
                  {stringify(schema)}
                </CodeBlock>
              ) : (
                <Schema anchors idPrefix={id} renderRef={Ref} schema={schema} />
              )}
            </div>
          </Fragment>
        );
      })}
    </main>
  );
}
