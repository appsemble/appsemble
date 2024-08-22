import { useBlock } from '@appsemble/preact';
import { isPreactChild } from '@appsemble/preact-components';
import { type VNode } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import styles from './index.module.css';
import { type FileField, type RendererProps, type VideoField } from '../../../block.js';
import { ImageField } from '../ImageField/index.js';

export function VideoRenderer({
  data,
  field: { height = 350, label, platform, thumbnail: t, value, width = 350 },
}: RendererProps<VideoField>): VNode {
  const {
    utils: { asset, remap },
  } = useBlock();

  const video = remap(value, data) as string;
  const thumbnail = remap(t, data) as string;

  const [videoUrl, setVideoUrl] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [assetVideoThumbnailUrl, setAssetVideoThumbnailUrl] = useState(null);

  const [videoIsAsset, setVideoIsAsset] = useState(false);
  const [fetchedAssetVideoHeaders, setFetchedAssetVideoHeaders] = useState(false);

  useEffect(() => {
    switch (platform) {
      case 'vimeo':
        setVideoUrl(`https://player.vimeo.com/video/${video}`);
        break;

      case 'youtube':
        setVideoUrl(`https://www.youtube.com/embed/${video}`);
        break;

      default:
        setVideoIsAsset(true);

        if (/^(https?:)?\/\//.test(video)) {
          setVideoUrl(video);
        } else {
          setVideoUrl(asset(video));
        }
        break;
    }
  }, [asset, platform, video]);

  useEffect(() => {
    if (/^(https?:)?\/\//.test(thumbnail)) {
      setThumbnailUrl(thumbnail);
    } else {
      setThumbnailUrl(thumbnail ? asset(thumbnail) : null);
    }
  }, [asset, thumbnail]);

  useEffect(() => {
    (async () => {
      if (videoUrl && videoIsAsset && !fetchedAssetVideoHeaders) {
        try {
          const response = await fetch(asset(`${video}-thumbnail`), {
            method: 'HEAD',
          });

          if (response.ok) {
            setAssetVideoThumbnailUrl(asset(`${video}-thumbnail`));
          }
        } catch {
          // Do nothing
        }
        setFetchedAssetVideoHeaders(true);
      }
    })();
  }, [fetchedAssetVideoHeaders, videoUrl, videoIsAsset, asset, video]);

  const sandboxConfig = 'allow-scripts allow-same-origin allow-presentation';

  return (
    <div className={styles.wrapper}>
      {isPreactChild(label) ? <h1 className="label">{label}</h1> : null}
      {video ? (
        platform ? (
          <iframe
            allowFullScreen
            height={height}
            sandbox={sandboxConfig}
            src={videoUrl}
            title="video"
            width={width}
          />
        ) : (
          <video
            controls
            height={height}
            id="interactive"
            poster={thumbnailUrl || assetVideoThumbnailUrl}
            src={videoUrl}
            width={width}
          >
            <track class="viewport" kind="captions" label="English" src="captions.vtt" />
          </video>
        )
      ) : thumbnailUrl ? (
        <ImageField field={{} as FileField} source={thumbnailUrl} />
      ) : null}
    </div>
  );
}
