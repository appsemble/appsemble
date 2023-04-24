import { useBlock } from '@appsemble/preact';
import { Modal, useObjectURL, useToggle } from '@appsemble/preact-components';
import { type Remapper } from '@appsemble/sdk';
import { type VNode } from 'preact';

import styles from './index.module.css';

interface ImageFieldProps {
  label?: unknown;
  name?: Remapper;
  src: Blob | string;
}

export function ImageField({ label, name, src }: ImageFieldProps): VNode {
  const { parameters, utils } = useBlock();
  const obj = typeof src === 'string' && parameters?.fileBase ? src : utils.asset(src as string);
  const url = useObjectURL(obj);
  const modal = useToggle();

  const alt = (label || utils.remap(name, src)) as string;

  return (
    <>
      <button className={`${styles.button} ${styles.root}`} onClick={modal.enable} type="button">
        <figure className={`image mr-3 ${styles.root}`}>
          <img alt={alt} className={styles.img} src={url} />
        </figure>
      </button>
      <Modal isActive={modal.enabled} onClose={modal.disable}>
        <figure className="image">
          <img alt={alt} src={url} />
        </figure>
      </Modal>
    </>
  );
}
