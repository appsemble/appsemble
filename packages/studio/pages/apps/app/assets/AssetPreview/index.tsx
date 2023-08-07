import { Button, Content } from '@appsemble/react-components';
import { type Asset } from '@appsemble/types';
import { type ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { useApp } from '../../index.js';

export function AssetPreview({ asset }: { readonly asset: Asset }): ReactElement {
  const { app } = useApp();

  if (!asset) {
    return null;
  }

  const url = `/api/apps/${app.id}/assets/${asset.id}`;
  const isImage = asset.mime.startsWith('image/');
  const isAudio = asset.mime.startsWith('audio/');
  const isVideo = asset.mime.startsWith('video/');

  return (
    <Content className={styles.preview}>
      <Button className="mb-2" component="a" download href={url} icon="download">
        <FormattedMessage {...messages.download} />
      </Button>
      <div className="box">
        {isImage ? <img alt={asset.filename || `Asset ${asset.id}`} src={url} /> : null}
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        {isAudio ? <audio controls src={url} /> : null}
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        {isVideo ? <video controls src={url} /> : null}
        {!isImage && !isAudio && !isVideo ? <FormattedMessage {...messages.notSupported} /> : null}
      </div>
    </Content>
  );
}
