import { Modal, useToggle } from '@appsemble/preact-components';
import { Fragment, type VNode } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

import styles from './index.module.css';

interface ImageComponentProps {
  /**
   * The image is scaled with bulma sizes.
   *
   * @default 48
   */
  readonly size: 16 | 24 | 32 | 48 | 64 | 96 | 128;

  /**
   * The aspect ratio the image should be displayed in.
   *
   * @default square
   */
  readonly aspectRatio?: '4:3' | '9:16' | '16:9' | 'square';

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

export function ImageComponent({
  alt,
  aspectRatio = 'square',
  id,
  rounded,
  size = 48,
  src,
}: ImageComponentProps): VNode {
  const modal = useToggle();

  const [isVisible, setIsVisible] = useState(false);

  const imgRef = useRef();

  let width = size;
  let height = size;
  if (aspectRatio !== 'square') {
    const [w, h] = aspectRatio.split(':').map(Number);
    if (w > h) {
      width = (w / h) * size;
    } else {
      height = (h / w) * size;
    }
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        }
      },
      {
        // Trigger when 10% of the image is visible
        threshold: 0.1,
      },
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        observer.unobserve(imgRef.current);
      }
    };
  }, [src]);

  return (
    <Fragment key={id}>
      {src ? (
        <>
          <button
            className={`${styles.button} ${styles.root}`}
            onClick={modal.enable}
            type="button"
          >
            <figure
              className={`image mr-2 ${styles.root}`}
              // eslint-disable-next-line react/forbid-dom-props
              style={{ width: `${width}px`, height: `${height}px` }}
            >
              <img
                alt={alt}
                className={`${styles.img} ${rounded && 'is-rounded'}`}
                ref={imgRef}
                src={isVisible ? src : undefined}
              />
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
