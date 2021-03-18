import { VNode } from 'preact';
import { Modal } from 'preact-components/src/Modal';
import { useToggle } from 'preact-components/src/useToggle';

import styles from './index.module.css';

interface CardImageProps {
  /**
   * The alt text for the image.
   */
  alt: string;

  /**
   * The classname that is applied to the figure.
   */
  className?: string;

  /**
   * The image source.
   */
  src: string;
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
