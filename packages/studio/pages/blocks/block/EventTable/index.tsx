import { Table, Title } from '@appsemble/react-components';
import { type BlockManifest } from '@appsemble/types';
import { defaultLocale } from '@appsemble/utils';
import { type ReactNode } from 'react';

import { MarkdownContent } from '../../../../components/MarkdownContent/index.js';

interface EventTableProps {
  /**
   * The block manifest to use for displaying the available events.
   */
  readonly manifest: BlockManifest;
}

/**
 * Render a table listing the events that can be used for a block.
 */
export function EventTable({ manifest }: EventTableProps): ReactNode {
  return (
    <>
      {manifest.events.emit ? (
        <>
          <Title level={5}>Emit Events</Title>
          <Table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody lang={defaultLocale}>
              {Object.entries(manifest.events.emit).map(([key, event]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>
                    <MarkdownContent content={event.description} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      ) : null}
      {manifest.events.listen ? (
        <>
          <Title level={5}>Listen Events</Title>
          <Table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody lang={defaultLocale}>
              {Object.entries(manifest.events.listen).map(([key, event]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>
                    <MarkdownContent content={event.description} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      ) : null}
    </>
  );
}
