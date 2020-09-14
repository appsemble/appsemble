import { Button, Content } from '@appsemble/react-components';
import { extension } from 'mime-types';
import React, { ReactElement, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import type { Asset } from '..';
import { download } from '../../../utils/download';
import { useApp } from '../../AppContext';
import styles from './index.css';
import { messages } from './messages';

export function AssetPreview({ asset }: { asset: Asset }): ReactElement {
  const { app } = useApp();

  const downloadAsset = useCallback(async () => {
    const { filename, id, mime } = asset;
    const ex = extension(mime);

    await download(`/api/apps/${app.id}/assets/${id}`, filename || ex ? `${id}.${ex}` : id);
  }, [app, asset]);

  if (!asset) {
    return null;
  }

  const url = `/api/apps/${app.id}/assets/${asset.id}`;
  const isImage = asset.mime.startsWith('image/');
  const isAudio = asset.mime.startsWith('audio/');
  const isVideo = asset.mime.startsWith('video/');

  return (
    <Content className={styles.preview}>
      <Button className="mb-2" icon="download" onClick={downloadAsset}>
        <FormattedMessage {...messages.download} />
      </Button>
      <div className="box">
        {isImage && <img alt={asset.filename || `Asset ${asset.id}`} src={url} />}
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        {isAudio && <audio controls src={url} />}
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        {isVideo && <video controls src={url} />}
        {!isImage && !isAudio && !isVideo && <FormattedMessage {...messages.notSupported} />}
      </div>
    </Content>
  );
}
