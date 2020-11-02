import { Join, Table } from '@appsemble/react-components';
import React, { ReactElement } from 'react';
import { Definition } from 'typescript-json-schema';

import { messages } from './messages';

interface TypeTableProps {
  /**
   * The definition of the type to render.
   */
  definition: Definition;
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
      <tbody>
        <tr>
          <td>{definition.type}</td>
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
