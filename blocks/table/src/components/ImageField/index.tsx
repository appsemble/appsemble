import { useBlock } from '@appsemble/preact';
import { Modal, useToggle } from '@appsemble/preact-components';
import { Fragment, type VNode } from 'preact';

import styles from './index.module.css';
import { type Image } from '../../../block.js';

interface ImageFieldProps {
  /**
   * The definition used to render out the field.
   */
  field: Image;

  /**
   * The index of the row that was clicked.
   */
  index: number;

  /**
   * The data to display.
   */
  item: unknown;

  /**
   * The index of the sub row that was clicked.
   */
  repeatedIndex: number;
}

export function ImageField({ field, index, item, repeatedIndex }: ImageFieldProps): VNode {
  const {
    utils: { asset, remap },
  } = useBlock();

  const img = remap(field.image.file, item, { index, repeatedIndex }) as string;

  const modal = useToggle();

  const {
    image: { width },
  } = field;

  return (
    <Fragment key={index}>
      {img ? (
        <>
          <button
            className={`${styles.button} ${styles.root}`}
            onClick={modal.enable}
            type="button"
          >
            <figure className={`mr-3 ${styles.root}`}>
              <img
                alt="list icon"
                className={styles.img}
                src={/^(https?:)?\/\//.test(img) ? img : asset(img)}
                width={width}
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
