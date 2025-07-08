import {
  camelToHyphen,
  defaultLocale,
  examples,
  type RemapperExampleKeys,
} from '@appsemble/lang-sdk';
import { Title } from '@appsemble/react-components';
import { type OpenAPIV3 } from 'openapi-types';
import { Fragment, type ReactNode } from 'react';

import { Collapsible } from '../../../../components/Collapsible/index.js';
import { Playground } from '../../../../components/Playground/index.js';
import { type RenderRefProps, Schema } from '../../../../components/Schema/index.js';

function Ref({ isArray, jsonRef }: RenderRefProps): ReactNode {
  const name = jsonRef.split('/').pop();

  return (
    <>
      {name === 'RemapperDefinition' ? 'RemapperDefinition' : 'XXX Unknown link type'}
      {isArray ? '[]' : null}
    </>
  );
}

export function RemapperRef({
  remappers,
}: {
  readonly remappers: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>;
}): ReactNode {
  return (
    <main lang={defaultLocale}>
      {Object.entries(remappers).map(([name, schema]) => {
        const id = camelToHyphen(name);
        const [defaultOption] =
          // A remapper example must match: { remapper-name: ... }
          // This ensures the first matching remapper example is used.
          Object.entries(examples).find(([, { remapper }]) => Object.keys(remapper)[0] === name) ??
          [];
        return (
          <Fragment key={name}>
            <Title anchor className="mb-1 mt-5" id={id} size={5}>
              {name}
            </Title>
            {defaultOption ? (
              <Collapsible className="is-6" collapsed title="Playground">
                <Playground defaultOption={defaultOption as RemapperExampleKeys} />
              </Collapsible>
            ) : null}
            <Schema idPrefix={id} renderRef={Ref} schema={schema} />
          </Fragment>
        );
      })}
    </main>
  );
}
