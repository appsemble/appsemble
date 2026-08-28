import { useBlock } from '@appsemble/preact';
import { AppAssetDownloadButton, Modal, useToggle } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type VNode } from 'preact';

import styles from './index.module.css';
import { type Image } from '../../../block.js';

export function ImageComponent({ field }: { field: Image }): VNode {
  const {
    data,
    utils: { asset, formatMessage, remap },
  } = useBlock();
  const modal = useToggle();
  const file = remap(field.file, data) as string;
  const src = /^(https?:)?\/\//.test(file) ? file : asset(file);
  const alt = (remap(field.alt, data) as string) || '';
  const enlarge = field.enlarge === undefined || Boolean(remap(field.enlarge, data));

  return enlarge ? (
    <>
      <button
        aria-label={alt || formatMessage('enlargeImage')}
        className={classNames(styles.button, styles.root)}
        onClick={modal.enable}
        type="button"
      >
        <figure className="image mx-1">
          <img alt="" className={styles.img} src={src} />
        </figure>
      </button>
      <Modal
        closeButtonLabel={formatMessage('closeImage')}
        isActive={modal.enabled}
        onClose={modal.disable}
      >
        <AppAssetDownloadButton src={src} />
        <figure className="image">
          <img alt={alt} className={styles.img} src={src} />
        </figure>
      </Modal>
    </>
  ) : (
    <figure className={classNames('image mx-1', styles.root)}>
      <img alt={alt} className={styles.img} src={src} />
    </figure>
  );
}
