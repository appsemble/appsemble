import { Modal, useToggle } from '@appsemble/preact-components';
import { type VNode } from 'preact';

import styles from './index.module.css';

interface CardImageProps {
  /**
   * The alt text for the image.
   */
  readonly alt: string;

  /**
   * The class name that is applied to the figure.
   */
  readonly className?: string;

  /**
   * The image source.
   */
  readonly src: string;
}

export function CardImage({ alt, className, src }: CardImageProps): VNode {
  const modal = useToggle();

  return (
    <>
      <button
        className={`${styles.figure} ${styles.button} ${className}`}
        onClick={modal.enable}
        type="button"
      >
        <figure className={styles.figure}>
          <img alt={alt} className={styles.image} src={src} />
        </figure>
      </button>
      <Modal isActive={modal.enabled} onClose={modal.disable}>
        <figure className="image">
          <img alt={alt} src={src} />
        </figure>
      </Modal>
    </>
  );
}
