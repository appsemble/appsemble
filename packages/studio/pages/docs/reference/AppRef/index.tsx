import { Checkbox, Title, useMeta, useToggle } from '@appsemble/react-components';
import { camelToHyphen, iterJSONSchema, schemas } from '@appsemble/utils';
import { type Schema as JSONSchema } from 'jsonschema';
import { Fragment, type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { stringify } from 'yaml';

import { messages } from './messages.js';
import { CodeBlock } from '../../../../components/CodeBlock/index.js';
import { type RenderRefProps, Schema } from '../../../../components/Schema/index.js';

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

function Ref({ isArray, jsonRef }: RenderRefProps): ReactNode {
  const name = jsonRef.split('/').pop();

  return (
    <>
      <Link
        to={
          name === 'ActionDefinition'
            ? './action'
            : name === 'RemapperDefinition'
              ? './remappers'
              : `#${camelToHyphen(name)}`
        }
      >
        {name}
      </Link>
      {isArray ? '[]' : null}
    </>
  );
}

export function AppRef(): ReactNode {
  useMeta(messages.title, messages.description);

  const showYaml = useToggle();

  return (
    <>
      <Checkbox
        label={<FormattedMessage {...messages.showYaml} />}
        name="yaml"
        onChange={showYaml.toggle}
        switch
        value={showYaml.enabled}
      />
      {entries.map(([name, schema]) => {
        const id = camelToHyphen(name);

        return (
          <Fragment key={name}>
            <Title anchor className="is-flex is-justify-content-space-between" id={id} size={4}>
              {name}
            </Title>
            {showYaml.enabled ? (
              <CodeBlock className="mb-5" language="yaml">
                {stringify(schema)}
              </CodeBlock>
            ) : (
              <Schema anchors idPrefix={id} renderRef={Ref} schema={schema} />
            )}
          </Fragment>
        );
      })}
    </>
  );
}
