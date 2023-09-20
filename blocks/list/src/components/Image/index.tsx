import { useBlock } from '@appsemble/preact';
import { Modal, useToggle } from '@appsemble/preact-components';
import { Fragment, type VNode } from 'preact';

import styles from './index.module.css';
import { type Image } from '../../../block.js';

interface ImageComponentProps {
  /**
   * The definition used to render out the field.
   */
  readonly field: Image;

  /**
   * The index of the row that was clicked.
   */
  readonly index: number;

  /**
   * The data to display.
   */
  readonly item: unknown;
}

export function ImageComponent({
  field: { alt, file, rounded, size = 48 },
  index,
  item,
}: ImageComponentProps): VNode {
  const {
    utils: { asset, remap },
  } = useBlock();

  const img = remap(file, item, { index }) as string;
  const alternate = remap(alt, item, { index }) as string;

  const modal = useToggle();

  return (
    <Fragment key={index}>
      {img ? (
        <>
          <button
            className={`${styles.button} ${styles.root}`}
            onClick={modal.enable}
            type="button"
          >
            <figure className={`image is-${size}x${size}  mr-2 ${styles.root}`}>
              <img
                alt={alternate}
                className={`${styles.img} ${rounded && 'is-rounded'}`}
                src={/^(https?:)?\/\//.test(img) ? img : asset(img)}
              />
            </figure>
          </button>
          <Modal isActive={modal.enabled} onClose={modal.disable}>
            <figure className="image">
              <img alt="list icon" src={/^(https?:)?\/\//.test(img) ? img : asset(img)} />
            </figure>
          </Modal>
        </>
      ) : null}
    </Fragment>
  );
}
