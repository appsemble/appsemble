import { bootstrap } from '@appsemble/preact';
import { Modal, useToggle } from '@appsemble/preact-components';
import { type JSX } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import styles from './index.module.css';

bootstrap(
  ({
    actions,
    data: blockData,
    events,
    parameters: {
      alt: alternate,
      fullscreen = false,
      height = 250,
      input = false,
      url,
      width = 250,
    },
    ready,
    utils: { asset, remap },
  }) => {
    const [data, setData] = useState(blockData);
    const modal = useToggle();
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
      events.on.data((d) => {
        setData(d);
      });

      ready();
    }, [events, ready]);

    const alt = remap(alternate, data) as string;
    const img = remap(url, data) as string;
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
      setSelectedImage(img);
    }, [img]);

    useEffect(() => {
      if (imgRef.current) {
        imgRef.current.style.width = `${width}px`;
        imgRef.current.style.height = `${height}px`;
      }
    }, [height, imgRef, width, selectedImage]);

    const handleFileChange = useCallback(
      (event: JSX.TargetedEvent<HTMLInputElement>): void => {
        const { currentTarget } = event;
        const file = currentTarget.files[0] as Blob;
        currentTarget.value = null;

        setSelectedImage(URL.createObjectURL(file));

        actions.onChange({ ...(data as Record<string, unknown>), image: file });
      },
      [data, selectedImage],
    );

    return (
      <>
        <div className="is-flex">
          <div className={styles.imageScannerWrapper}>
            {selectedImage ? (
              <button onClick={modal.enable} type="button">
                <figure>
                  <img
                    alt={alt}
                    className={styles.img}
                    ref={imgRef}
                    src={
                      /^(https?:|blob:https?:)?\/\//.test(selectedImage)
                        ? selectedImage
                        : asset(selectedImage)
                    }
                  />
                </figure>
              </button>
            ) : null}

            {input ? (
              <label className={styles.fileLabel} for="fileInput">
                <i class="fas fa-pen" />
                <input
                  className={styles.hiddenInput}
                  id="fileInput"
                  onChange={handleFileChange}
                  type="file"
                />
              </label>
            ) : null}
          </div>
        </div>
        {fullscreen ? (
          <Modal isActive={modal.enabled} onClose={modal.disable}>
            <figure className="image">
              <img
                alt={alt}
                src={
                  /^(https?:|blob:https?:)?\/\//.test(selectedImage)
                    ? selectedImage
                    : asset(selectedImage)
                }
              />
            </figure>
          </Modal>
        ) : null}
      </>
    );
  },
);
