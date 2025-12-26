import { Modal, useToggle } from '../index.js';
import { Fragment, type VNode } from 'preact';
import { type MutableRef, useCallback, useEffect, useRef, useState } from 'preact/hooks';

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
   * @default false
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

  const imgRef = useRef<HTMLImageElement>();

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

  const handleClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      modal.enable();
    },
    [modal],
  );

  return (
    <Fragment key={id}>
      {src ? (
        <>
          <button className={`${styles.button} ${styles.root}`} onClick={handleClick} type="button">
            <figure
              className={`image mr-2 ${styles.root}`}
              // eslint-disable-next-line react/forbid-dom-props
              style={{ width: `${width}px`, height: `${height}px` }}
            >
              <img
                alt={alt}
                className={`${styles.img} ${rounded && 'is-rounded'}`}
                ref={imgRef as MutableRef<HTMLImageElement>}
                src={isVisible ? `${src}?width=${width}&height=${height}` : undefined}
              />
            </figure>
          </button>
          <Modal isActive={modal.enabled} onClose={modal.disable}>
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-noninteractive-element-interactions */}
            <figure
              className="image"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <img alt="list icon" src={src} />
            </figure>
          </Modal>
        </>
      ) : null}
    </Fragment>
  );
}
