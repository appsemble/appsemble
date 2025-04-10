import { useBlock } from '@appsemble/preact';
import { Modal, useToggle } from '@appsemble/preact-components';
import { type Remapper } from '@appsemble/sdk';
import { type VNode } from 'preact';

import styles from './index.module.css';
import { type FileField } from '../../../block.js';

interface ImageFieldProps {
  readonly field: FileField;
  readonly label?: unknown;
  readonly name?: Remapper;
  readonly source: Blob | string;
}

export function ImageField({
  field: { hide: conceal, rounded = false, size = 128 },
  label,
  name,
  source,
}: ImageFieldProps): VNode {
  const { utils } = useBlock();
  const modal = useToggle();
  const img = source as string;

  const alt = (label || utils.remap(name, source)) as string;
  const hide = utils.remap(conceal, source);

  return hide ? null : (
    <>
      <button className={`${styles.button} ${styles.root}`} onClick={modal.enable} type="button">
        <figure className={`image mr-3 is-${size}x${size} ${styles.root}`}>
          <img
            alt={alt}
            className={`${styles.img} ${rounded && 'is-rounded'}`}
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
