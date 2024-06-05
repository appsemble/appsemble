import { useBlock } from '@appsemble/preact';
import { ImageComponent } from '@appsemble/preact-components';
import { type VNode } from 'preact';

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
}

export function Image({
  field: { alt, file, rounded, size = 48 },
  index,
  item,
}: ImageComponentProps): VNode {
  const {
    utils: { asset, remap },
  } = useBlock();

  const alternate = remap(alt, item, { index }) as string;
  const img = remap(file, item, { index }) as string;
  const src = /^(https?:)?\/\//.test(img) ? img : asset(img);

  return <ImageComponent alt={alternate} id={index} rounded={rounded} size={size} src={src} />;
}
