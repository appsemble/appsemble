import { useBlock } from '@appsemble/preact';
import { isPreactChild } from '@appsemble/preact-components';
import { type VNode } from 'preact';
import { useState } from 'preact/hooks';

import styles from './index.module.css';
import { type RendererProps, type VideoField } from '../../../block.js';

export function VideoRenderer({
  data,
  field: { height = 350, label, platform, thumbnail, value, width = 350 },
}: RendererProps<VideoField>): VNode {
  const {
    utils: { asset, remap },
  } = useBlock();
  const videoLink = remap(value, data) as string;
  const thumbnailLink = remap(thumbnail, data) as string;
  const [url, setUrl] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const sandboxConfig = 'allow-scripts allow-same-origin allow-presentation';

  if (!platform) {
    if (/^(https?:)?\/\//.test(videoLink)) {
      setUrl(videoLink);
    } else {
      setUrl(asset(videoLink));
    }
  } else if (platform === 'vimeo') {
    setUrl(`https://player.vimeo.com/video/${videoLink}`);
  } else if (platform === 'youtube') {
    setUrl(`https://www.youtube.com/embed/${videoLink}`);
  }

  if (/^(https?:)?\/\//.test(thumbnailLink)) {
    setThumbnailUrl(thumbnailLink);
  } else {
    setThumbnailUrl(asset(thumbnailLink));
  }

  return (
    <div className={styles.wrapper}>
      {isPreactChild(label) ? <h1 className="label">{label}</h1> : null}
      {platform ? (
        <iframe
          allowFullScreen
          height={height}
          sandbox={sandboxConfig}
          src={url}
          title="video"
          width={width}
        />
      ) : (
        <video
          controls
          height={height}
          id="interactive"
          poster={thumbnailUrl}
          src={url}
          width={width}
        >
          <track class="viewport" kind="captions" label="English" src="captions.vtt" />
        </video>
      )}
    </div>
  );
}
