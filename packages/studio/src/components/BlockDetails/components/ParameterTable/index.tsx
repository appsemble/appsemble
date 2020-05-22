import { Table } from '@appsemble/react-components';
import type { BlockManifest } from '@appsemble/types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

interface ParameterTableProps {
  manifest: BlockManifest;
}

export default function ParameterTable({ manifest }: ParameterTableProps): React.ReactElement {
  const generateRow = React.useCallback(
    (key: string, value: any, recurse: boolean): React.ReactNode | React.ReactNode[] => {
      console.log({ key, value, recurse });
      if (value.type === 'array' && recurse) {
        const result = [];
        result.push(generateRow(`${key}[]`, value, false));
        if (value.items.anyOf) {
          result.push(
            ...value.items.anyOf.map((anyOf: any) =>
              Object.entries(anyOf.properties).map(([k, v], index) => {
                console.log({ k, v, index });
                return generateRow(`${key}[].${k}`, v, true);
              }),
            ),
          );
        }

        return result;
      }

      return (
        <tr key={key}>
          <td>{key}</td>
          <td>
            {(manifest.parameters as any).required?.includes(key) ? (
              <FormattedMessage {...messages.true} />
            ) : (
              <FormattedMessage {...messages.false} />
            )}
          </td>
          <td>{(value as any).type}</td>
          <td>{(value as any).description}</td>
        </tr>
      );
    },
    [manifest],
  );
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
        {Object.entries((manifest.parameters as any).properties).map(([key, value]) =>
          generateRow(key, value, true),
        )}
      </tbody>
    </Table>
  );
}
