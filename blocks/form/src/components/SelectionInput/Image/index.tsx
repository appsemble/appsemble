import { useBlock } from '@appsemble/preact';
import { ImageComponent } from '@appsemble/preact-components';
import { getMimeTypeCategory, normalized } from '@appsemble/utils';
import { type VNode } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import { type Image as ImageInterface, type SelectionChoice } from '../../../../block.js';

interface ImageComponentProps {
  /**
   * The definition used to render out the field.
   */
  readonly image: ImageInterface;

  /**
   * The index of the row that was clicked.
   */
  readonly id: number | string;

  /**
   * The data to get properties from.
   */
  readonly option: SelectionChoice;

  /**
   * Whether the list item is visible on the screen.
   */
  readonly isVisible: boolean;
}

export function Image({
  id,
  image: { alt, file, rounded, size = 48 },
  isVisible,
  option,
}: ImageComponentProps): VNode {
  const {
    utils: { asset, remap },
  } = useBlock();

  const alternate = remap(alt, option, { id }) as string;
  const value = remap(file, option, { id }) as string;

  const [src, setSrc] = useState('');
  const [fetched, setFetched] = useState(false);

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
  }, [asset, option, fetched, value, isVisible]);

  return <ImageComponent alt={alternate} id={id} rounded={rounded} size={size} src={src} />;
}
