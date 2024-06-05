import { Modal, useToggle } from '@appsemble/preact-components';
import { Fragment, type VNode } from 'preact';

import styles from './index.module.css';

interface ImageComponentProps {
  /**
   * The image is scaled with bulma sizes.
   *
   * @default 48
   */
  readonly size: 16 | 24 | 32 | 48 | 64 | 96 | 128;

  /**
   * Is the image rounded.
   *
   */
  readonly rounded?: boolean;

  /**
   * The id of the image.
   */
  readonly id: number | string;

  /**
   * The src of the image to display.
   */
  readonly src: string;

  /**
   * The alt image to display.
   */
  readonly alt: string;
}

export function ImageComponent({ alt, id, rounded, size = 48, src }: ImageComponentProps): VNode {
  const modal = useToggle();

  return (
    <Fragment key={id}>
      {src ? (
        <>
          <button
            className={`${styles.button} ${styles.root}`}
            onClick={modal.enable}
            type="button"
          >
            <figure className={`image is-${size}x${size} mr-2 ${styles.root}`}>
              <img alt={alt} className={`${styles.img} ${rounded && 'is-rounded'}`} src={src} />
            </figure>
          </button>
          <Modal isActive={modal.enabled} onClose={modal.disable}>
            <figure className="image">
              <img alt="list icon" src={src} />
            </figure>
          </Modal>
        </>
      ) : null}
    </Fragment>
  );
}
