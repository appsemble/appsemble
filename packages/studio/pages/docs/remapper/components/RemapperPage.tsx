import { Title, useMeta } from '@appsemble/react-components';
import { camelToHyphen, defaultLocale } from '@appsemble/utils';
import { type OpenAPIV3 } from 'openapi-types';
import { Fragment, type ReactElement } from 'react';

import { Schema } from '../../../../components/Schema/index.js';
import { messages } from '../messages.js';
import { Ref } from '../Ref/index.js';

export function RemapperPage({
  remappers,
}: {
  readonly remappers: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>;
}): ReactElement {
  useMeta(messages.title, messages.description);
  return (
    <main lang={defaultLocale}>
      {Object.entries(remappers).map(([name, schema]) => {
        const id = camelToHyphen(name);

        return (
          <Fragment key={name}>
            <Title anchor className="pl-8 mb-1 mt-5" id={id} size={5}>
              {name}
            </Title>
            <div>
              <Schema idPrefix={id} renderRef={Ref} schema={schema} />
            </div>
          </Fragment>
        );
      })}
    </main>
  );
}
