import { useBlock } from '@appsemble/preact';
import { ImageComponent } from '@appsemble/preact-components';
import { type VNode } from 'preact';

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
}

export function Image({
  id,
  image: { alt, file, rounded, size = 48 },
  option,
}: ImageComponentProps): VNode {
  const {
    utils: { asset, remap },
  } = useBlock();

  const alternate = remap(alt, option, { id }) as string;
  const img = remap(file, option, { id }) as string;
  const src = /^(https?:)?\/\//.test(img) ? img : asset(img);

  return <ImageComponent alt={alternate} id={id} rounded={rounded} size={size} src={src} />;
}
