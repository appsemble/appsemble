import { Table } from '@appsemble/react-components';
import type { BlockManifest } from '@appsemble/types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

interface EventTableProps {
  manifest: BlockManifest;
}

export default function EventTable({ manifest }: EventTableProps): React.ReactElement {
  return (
    <>
      {manifest.events.emit && (
        <Table>
          <thead>
            <tr>
              <th>
                <FormattedMessage {...messages.name} />
              </th>
            </tr>
          </thead>
          <tbody>
            {manifest.events.emit.map((event) => (
              <tr key={`emit ${event}`}>
                <td>{event}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {manifest.events.listen && (
        <Table>
          <thead>
            <tr>
              <th>
                <FormattedMessage {...messages.name} />
              </th>
            </tr>
          </thead>
          <tbody>
            {manifest.events.listen.map((event) => (
              <tr key={`listen ${event}`}>
                <td>{event}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
