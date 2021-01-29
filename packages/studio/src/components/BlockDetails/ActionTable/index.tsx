import { Icon, Table } from '@appsemble/react-components';
import { BlockManifest } from '@appsemble/types';
import { ReactElement } from 'react';

import { messages } from './messages';

interface ActionTableProps {
  /**
   * The block manifest to use for displaying the available actions.
   */
  manifest: BlockManifest;
}

/**
 * Render a table of all available actions for a block.
 */
export function ActionTable({ manifest }: ActionTableProps): ReactElement {
  return (
    <Table>
      <thead>
        <tr>
          <th>{messages.name}</th>
          <th>{messages.required}</th>
          <th>{messages.description}</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(manifest.actions).map(([key, value]) => (
          <tr key={key}>
            <td>{key === '$any' ? messages.anyAction : key}</td>
            <td>{value.required && <Icon className="has-text-success" icon="check" />}</td>
            <td>{value.description}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
