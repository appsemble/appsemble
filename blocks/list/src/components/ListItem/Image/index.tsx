import { useBlock } from '@appsemble/preact';
import { ImageComponent } from '@appsemble/preact-components';
import { getMimeTypeCategory, normalized } from '@appsemble/utils';
import { type VNode } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import { type Image as ImageInterface } from '../../../../block.js';

interface ImageComponentProps {
  /**
   * The definition used to render out the field.
   */
  readonly field: ImageInterface;

  /**
   * The index of the row that was clicked.
   */
  readonly index: number;

  /**
   * The data to display.
   */
  readonly item: unknown;

  /**
   * Whether the list item is visible on the screen.
   */
  readonly isVisible: boolean;
}

export function Image({
  field: { alt, aspectRatio = 'square', file, rounded, size = 48 },
  index,
  isVisible,
  item,
}: ImageComponentProps): VNode {
  const {
    utils: { asset, remap },
  } = useBlock();

  const alternate = remap(alt, item, { index }) as string;
  const value = remap(file, item, { index }) as string;

  const [src, setSrc] = useState('');
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    setFetched(false);
  }, [value]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    (async () => {
      if (value) {
        if (/^(https?:)?\/\//.test(value)) {
          setSrc(value);
        } else if (normalized.test(value) && !fetched) {
          setSrc(asset(value as string));

          try {
            const response = await fetch(asset(value as string), { method: 'HEAD' });
            if (response.ok) {
              const contentType = response.headers.get('Content-Type');
              if (contentType && getMimeTypeCategory(contentType) === 'video') {
                try {
                  const thumbnailResponse = await fetch(asset(`${value}-thumbnail`), {
                    method: 'HEAD',
                  });

                  if (thumbnailResponse.ok) {
                    setSrc(asset(`${value}-thumbnail`));
                  }
                } catch {
                  // Do nothing
                }
              }
            }
          } catch {
            // Do nothing
          }
          setFetched(true);
        }
      }
    })();
  }, [asset, item, fetched, value, isVisible]);

  return (
    <ImageComponent
      alt={alternate}
      aspectRatio={aspectRatio}
      id={index}
      rounded={rounded}
      size={size}
      src={src}
    />
  );
}
