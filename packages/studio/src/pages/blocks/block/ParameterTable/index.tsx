import { Table } from '@appsemble/react-components';
import { defaultLocale } from '@appsemble/utils';
import { Schema } from 'jsonschema';
import { ReactElement } from 'react';

import { ParameterRow } from '../ParameterRow';
import { messages } from './messages';

interface ParameterTableProps {
  /**
   * The parameters that should be rendered.
   */
  parameters: Schema;
}

/**
 * Render out the parameters of a block in a table.
 */
export function ParameterTable({ parameters }: ParameterTableProps): ReactElement {
  return (
    <Table>
      <thead>
        <tr>
          <th>{messages.name}</th>
          <th>{messages.required}</th>
          <th>{messages.type}</th>
          <th>{messages.default}</th>
          <th>{messages.description}</th>
        </tr>
      </thead>
      <tbody lang={defaultLocale}>
        {Object.entries(parameters.properties).map(([key, value]) => (
          <ParameterRow
            key={key}
            name={key}
            parent={parameters}
            recurse
            required={
              (Array.isArray(parameters.required) && parameters.required.includes(key)) ||
              value.required === true
            }
            value={value}
          />
        ))}
      </tbody>
    </Table>
  );
}
