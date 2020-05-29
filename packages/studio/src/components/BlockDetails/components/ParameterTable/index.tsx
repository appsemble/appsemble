import { Table } from '@appsemble/react-components';
import type { OpenAPIV3 } from 'openapi-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { ExtendedParameters } from '../..';
import ParameterRow from '../ParameterRow';
import messages from './messages';

interface ParameterTableProps {
  /**
   * The parameters that should be rendered.
   */
  parameters: ExtendedParameters;
}

/**
 * Renders out the parameters of a block in a table.
 */
export default function ParameterTable({ parameters }: ParameterTableProps): React.ReactElement {
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
            <FormattedMessage {...messages.description} />
          </th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(parameters.properties).map(([key, value]) => (
          <ParameterRow
            key={key}
            name={key}
            parent={parameters as OpenAPIV3.SchemaObject}
            recurse
            value={value as OpenAPIV3.SchemaObject}
          />
        ))}
      </tbody>
    </Table>
  );
}
