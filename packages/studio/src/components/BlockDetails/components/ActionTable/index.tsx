import { Icon, Table } from '@appsemble/react-components';
import type { BlockManifest } from '@appsemble/types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

interface ActionTableProps {
  manifest: BlockManifest;
}

export default function ActionTable({ manifest }: ActionTableProps): React.ReactElement {
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
            <td>{(value as any).description}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
