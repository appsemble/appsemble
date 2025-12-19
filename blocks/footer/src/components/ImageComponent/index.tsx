import { useBlock } from '@appsemble/preact';
import { Modal, useToggle } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type VNode } from 'preact';

import styles from './index.module.css';
import { type Image } from '../../../block.js';

export function ImageComponent({ field }: { field: Image }): VNode | null {
  const {
    data,
    utils: { asset, remap },
  } = useBlock();
  const modal = useToggle();
  const file = remap(field.file, data) as string;
  const img = asset(file);

  const alt = remap(field.alt, data) as string;
  const hide = remap(field.hide, data);

  return hide ? null : (
    <>
      <button
        className={classNames(styles.button, styles.root)}
        onClick={modal.enable}
        /* eslint-disable-next-line react/forbid-dom-props */
        style={{ backgroundImage: `url(${img})` }}
        type="button"
      >
        <figure className="image mx-1">
          <img alt={alt} className={styles.img} src={img} />
        </figure>
      </button>
      <Modal isActive={modal.enabled} onClose={modal.disable}>
        <figure className="image">
          <img alt={alt} className={styles.img} src={img} />
        </figure>
      </Modal>
    </>
  );
}
