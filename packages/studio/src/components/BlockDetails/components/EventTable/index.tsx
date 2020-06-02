import { Table, Title } from '@appsemble/react-components';
import type { BlockManifest } from '@appsemble/types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

interface EventTableProps {
  /**
   * The block manifest to use for displaying the available events.
   */
  manifest: BlockManifest;
}

/**
 * Render a table listing the events that can be used for a block.
 */
export default function EventTable({ manifest }: EventTableProps): React.ReactElement {
  return (
    <>
      {manifest.events.emit && (
        <>
          <Title level={5}>
            <FormattedMessage {...messages.emitEvents} />
          </Title>
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
                <tr key={event}>
                  <td>{event}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
      {manifest.events.listen && (
        <>
          <Title level={5}>
            <FormattedMessage {...messages.listenEvents} />
          </Title>
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
                <tr key={event}>
                  <td>{event}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </>
  );
}
