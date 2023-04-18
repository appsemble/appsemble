import { useBlock } from '@appsemble/preact';
import { Modal, useToggle } from '@appsemble/preact-components';
import { Fragment, VNode } from 'preact';

import { Image } from '../../../block.js';
import styles from './index.module.css';

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

  const img = remap(field.image, item, { index, repeatedIndex }) as string;

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
            <figure className={`image mr-3 ${styles.root}`}>
              <img
                alt="list icon"
                className={styles.img}
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
