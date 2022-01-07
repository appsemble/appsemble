import { Button, Checkbox, ModalCard, useToggle } from '@appsemble/react-components';
import { Asset } from '@appsemble/types';
import { ChangeEvent, ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import { useApp } from '../..';
import { AssetPreview } from '../AssetPreview';
import { messages } from './messages';

interface AssetRowProps {
  /**
   * The asset to render a row fow.
   */
  asset: Asset;

  onSelect: (event: ChangeEvent<HTMLInputElement>, checked: boolean) => void;

  isSelected: boolean;
}

/**
 * Render a table row in the asset overview.
 */
export function AssetRow({ asset, isSelected, onSelect }: AssetRowProps): ReactElement {
  const { app } = useApp();
  const preview = useToggle();

  return (
    <tr key={asset.id}>
      <td>
        <Checkbox
          className="is-inline-block mt-2"
          name={`asset${asset.id}`}
          onChange={onSelect}
          value={isSelected}
        />
        <Button
          color="primary"
          component="a"
          download
          href={`/api/apps/${app.id}/assets/${asset.id}`}
          icon="download"
        />
      </td>
      <td>{asset.name || asset.id}</td>
      <td>
        {asset.resourceId == null ? null : (
          <Link to={`./resources/${asset.resourceType}/${asset.resourceId}`}>
            {asset.resourceId}
          </Link>
        )}
      </td>
      <td>{asset.mime}</td>
      <td>{asset.filename}</td>
      <td>
        <Button onClick={preview.enable}>
          <FormattedMessage {...messages.preview} />
        </Button>
      </td>
      <ModalCard
        isActive={preview.enabled}
        onClose={preview.disable}
        title={<FormattedMessage {...messages.preview} />}
      >
        <AssetPreview asset={asset} />
      </ModalCard>
    </tr>
  );
}
