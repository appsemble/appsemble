import { useBlock } from '@appsemble/preact';
import { Modal, useToggle } from '@appsemble/preact-components';
import { type Remapper } from '@appsemble/sdk';
import { type VNode } from 'preact';

import styles from './index.module.css';

interface ImageFieldProps {
  label?: unknown;
  name?: Remapper;
  source: Blob | string;
}

export function ImageField({ label, name, source }: ImageFieldProps): VNode {
  const { utils } = useBlock();
  const modal = useToggle();
  const img = source as string;

  const alt = (label || utils.remap(name, source)) as string;

  return (
    <>
      <button className={`${styles.button} ${styles.root}`} onClick={modal.enable} type="button">
        <figure className={`image mr-3 ${styles.root}`}>
          <img
            alt={alt}
            className={styles.img}
            src={/^(https?:)?\/\//.test(img) ? img : utils.asset(img)}
          />
        </figure>
      </button>
      <Modal isActive={modal.enabled} onClose={modal.disable}>
        <figure className="image">
          <img alt={alt} src={/^(https?:)?\/\//.test(img) ? img : utils.asset(img)} />
        </figure>
      </Modal>
    </>
  );
}
