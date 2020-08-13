import { Table } from '@appsemble/react-components';
import React, { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import type { Definition } from 'typescript-json-schema';

import { ParameterRow } from '../ParameterRow';
import { messages } from './messages';

interface ParameterTableProps {
  /**
   * The parameters that should be rendered.
   */
  parameters: Definition;
}

/**
 * Render out the parameters of a block in a table.
 */
export function ParameterTable({ parameters }: ParameterTableProps): ReactElement {
  return (
    <Table>
      <thead>
        <tr>
          <th>
            <FormattedMessage {...messages.name} />
          </th>
          <th>
            <FormattedMessage {...messages.required} />
          </th>
          <th>
            <FormattedMessage {...messages.type} />
          </th>
          <th>
            <FormattedMessage {...messages.default} />
          </th>
          <th>
            <FormattedMessage {...messages.description} />
          </th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(parameters.properties).map(([key, value]) => (
          <ParameterRow
            key={key}
            name={key}
            parent={parameters}
            recurse
            value={value as Definition}
          />
        ))}
      </tbody>
    </Table>
  );
}
