import { useBlock } from '@appsemble/preact';
import { useObjectURL } from '@appsemble/preact-components';
import { Remapper } from '@appsemble/sdk';
import { VNode } from 'preact';

import styles from './ImageField.css';

interface ImageFieldProps {
  label?: Remapper;
  name?: Remapper;
  src: Blob | string;
}

export function ImageField({ label, name, src }: ImageFieldProps): VNode {
  const { parameters, utils } = useBlock();
  const obj = typeof src === 'string' && parameters?.fileBase ? src : utils.asset(src as string);
  const url = useObjectURL(obj);

  const alt = utils.remap(label, src) || name;

  return (
    <figure className={`image mr-3 ${styles.root}`}>
      <img alt={alt} className={styles.img} src={url} />
    </figure>
  );
}
