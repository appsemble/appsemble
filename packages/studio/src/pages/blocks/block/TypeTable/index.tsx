import { Join, Table } from '@appsemble/react-components';
import { defaultLocale } from '@appsemble/utils';
import { Schema } from 'jsonschema';
import { OpenAPIV3 } from 'openapi-types';
import { ReactElement } from 'react';

import { messages } from './messages';

interface TypeTableProps {
  /**
   * The definition of the type to render.
   */
  definition: Schema;
}

/**
 * Render a table describing the types definitions that are passed through.
 */
export function TypeTable({ definition }: TypeTableProps): ReactElement {
  return (
    <Table>
      <thead>
        <tr>
          <th>{messages.type}</th>
          <th>{messages.format}</th>
          <th>{messages.enum}</th>
        </tr>
      </thead>
      <tbody lang={defaultLocale}>
        <tr>
          <td>
            <Join separator=" | ">
              {[
                ...(Array.isArray(definition.type) ? definition.type : [definition.type])
                  .filter(Boolean)
                  // eslint-disable-next-line react/no-array-index-key
                  .map((type, index) => <code key={`type.${index}`}>{type}</code>),
                ...(definition.anyOf?.map((any: OpenAPIV3.ReferenceObject, index) => {
                  const refName = any.$ref?.split('/').pop();

                  if (!refName) {
                    // eslint-disable-next-line react/no-array-index-key
                    return <code key={index}>{(any as any).type}</code>;
                  }
                  return (
                    <a href={`#${refName}`} key={refName}>
                      {refName}
                    </a>
                  );
                }) ?? []),
              ]}
            </Join>
          </td>
          <td>{definition.format}</td>
          <td>
            <Join separator=" | ">
              {(definition.enum || []).map((e) => (
                <code key={JSON.stringify(e)}>{JSON.stringify(e)}</code>
              ))}
            </Join>
          </td>
        </tr>
      </tbody>
    </Table>
  );
}
