import { useBlock } from '@appsemble/preact';
import { Modal, useObjectURL, useToggle } from '@appsemble/preact-components';
import { Remapper } from '@appsemble/sdk';
import { VNode } from 'preact';

import styles from './index.module.css';

interface ImageFieldProps {
  label?: Remapper;
  name?: Remapper;
  src: Blob | string;
}

export function ImageField({ label, name, src }: ImageFieldProps): VNode {
  const { parameters, utils } = useBlock();
  const obj = typeof src === 'string' && parameters?.fileBase ? src : utils.asset(src as string);
  const url = useObjectURL(obj);
  const modal = useToggle();

  const alt = utils.remap(label, src) || name;

  return (
    <>
      <button className={`${styles.button} ${styles.root}`} onClick={modal.enable} type="button">
        <figure className={`image mr-3 ${styles.root}`}>
          <img alt={alt} className={styles.img} src={url} />
        </figure>
      </button>
      <Modal isActive={modal.enabled} onClose={modal.disable}>
        <p className="image">
          <img alt={alt} src={url} />
        </p>
      </Modal>
    </>
  );
}
