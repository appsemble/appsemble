/** @jsx h */
import { useBlock } from '@appsemble/preact';
import { useObjectURL } from '@appsemble/preact-components';
import type { Remapper } from '@appsemble/sdk';
import { h, VNode } from 'preact';

import styles from './ImageField.css';

interface ImageFieldProps {
  className?: string;
  label?: Remapper;
  name?: Remapper;
  src: string | Blob;
}

export default function ImageField({ className, label, name, src }: ImageFieldProps): VNode {
  const { parameters, utils } = useBlock();
  const obj = typeof src === 'string' && parameters?.fileBase ? src : utils.asset(src as string);
  const url = useObjectURL(obj);

  const alt = utils.remap(label, src) || name;

  return (
    <figure className={`image mr-3 ${styles.root} ${className}`}>
      <img alt={alt} className={styles.img} src={url} />
    </figure>
  );
}
