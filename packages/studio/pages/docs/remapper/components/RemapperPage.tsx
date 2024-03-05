import { Title, useMeta } from '@appsemble/react-components';
import { camelToHyphen, defaultLocale, examples, type RemapperExampleKeys } from '@appsemble/utils';
import { type OpenAPIV3 } from 'openapi-types';
import { Fragment, type ReactNode } from 'react';

import { Collapsible } from '../../../../components/Collapsible/index.js';
import { Playground } from '../../../../components/Playground/index.js';
import { Schema } from '../../../../components/Schema/index.js';
import { messages } from '../messages.js';
import { Ref } from '../Ref/index.js';

export function RemapperPage({
  remappers,
}: {
  readonly remappers: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>;
}): ReactNode {
  useMeta(messages.title, messages.description);
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
            <Title anchor className="pl-8 mb-1 mt-5" id={id} size={5}>
              {name}
            </Title>
            {defaultOption ? (
              <Collapsible className="is-6" collapsed title="Playground">
                <Playground defaultOption={defaultOption as RemapperExampleKeys} />
              </Collapsible>
            ) : null}
            <div>
              <Schema idPrefix={id} renderRef={Ref} schema={schema} />
            </div>
          </Fragment>
        );
      })}
    </main>
  );
}
