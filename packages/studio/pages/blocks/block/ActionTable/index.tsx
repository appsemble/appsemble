import { Icon, Table } from '@appsemble/react-components';
import { type BlockManifest } from '@appsemble/types';
import { defaultLocale } from '@appsemble/utils';
import { type ReactNode } from 'react';

interface ActionTableProps {
  /**
   * The block manifest to use for displaying the available actions.
   */
  readonly manifest: BlockManifest;
}

/**
 * Render a table of all available actions for a block.
 */
export function ActionTable({ manifest }: ActionTableProps): ReactNode {
  return (
    <Table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Required</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody lang={defaultLocale}>
        {Object.entries(manifest.actions).map(([key, value]) => (
          <tr key={key}>
            <td>{key === '$any' ? '[Any custom name]' : key}</td>
            <td>{value.required ? <Icon className="has-text-success" icon="check" /> : null}</td>
            <td>{value.description}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
