import { Icon, Table } from '@appsemble/react-components';
import type { BlockManifest } from '@appsemble/types';
import React, { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

interface ActionTableProps {
  /**
   * The block manifest to use for displaying the available actions.
   */
  manifest: BlockManifest;
}

/**
 * Render a table of all available actions for a block.
 */
export default function ActionTable({ manifest }: ActionTableProps): ReactElement {
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
            <FormattedMessage {...messages.description} />
          </th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(manifest.actions).map(([key, value]) => (
          <tr key={key}>
            <td>{key === '$any' ? <FormattedMessage {...messages.anyAction} /> : key}</td>
            <td>{value.required && <Icon className="has-text-success" icon="check" />}</td>
            <td>{value.description}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
