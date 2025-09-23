import { bootstrap } from '@appsemble/preact';
import { Modal, useToggle } from '@appsemble/preact-components';
import { type JSX } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import defaultPic from './addpicture.svg';
import styles from './index.module.css';

bootstrap(
  ({
    actions,
    data: blockData,
    events,
    parameters: {
      alignment = 'center',
      alt: alternate,
      defaultImage = defaultPic,
      fullscreen = false,
      height = 250,
      input = false,
      name,
      rounded = false,
      url,
      width = 250,
    },
    ready,
    utils: { asset, remap },
  }) => {
    const [data, setData] = useState(blockData);
    const modal = useToggle();
    const boxRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
      events.on.data((d) => {
        setData(d);
      });

      ready();
    }, [events, ready]);

    const alt = remap(alternate, data) as string;
    const img = remap(url, data) as string;
    const defaultSrc = remap(defaultImage, data) as string;
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
      setSelectedImage(img);
    }, [img]);

    if (boxRef.current) {
      boxRef.current.style.justifyContent =
        alignment === 'right' ? 'flex-start' : alignment === 'left' ? 'left' : 'center';
    }
    if (imgRef.current) {
      imgRef.current.style.width = `${width}px`;
      imgRef.current.style.height = `${height}px`;
      imgRef.current.style.borderRadius = (rounded && '50%') as string;
      if (defaultImage) {
        imgRef.current.style.backgroundColor = '#5393ff';
      }
    }

    const handleFileChange = useCallback(
      (event: JSX.TargetedEvent<HTMLInputElement>): void => {
        const { currentTarget } = event;
        const file = currentTarget.files?.[0] as Blob;
        // @ts-expect-error strictNullCheck
        currentTarget.value = null;

        setSelectedImage(URL.createObjectURL(file));

        actions.onChange({
          ...(data as Record<string, unknown>),
          ...(name ? { [name]: file } : null),
        });
      },
      [data, selectedImage],
    );

    return (
      <>
        <div className="is-flex" ref={boxRef}>
          <div className={styles.imageScannerWrapper}>
            <button onClick={modal.enable} type="button">
              <figure>
                <img
                  alt={alt}
                  className={styles.img}
                  ref={imgRef}
                  src={
                    selectedImage
                      ? /^(https?:|blob:https?:)?\/\//.test(selectedImage)
                        ? selectedImage
                        : asset(selectedImage)
                      : defaultSrc
                  }
                />
              </figure>
            </button>
            {input ? (
              /* eslint-disable-next-line jsx-a11y/label-has-associated-control */
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
                  /^(https?:|blob:https?:)?\/\//.test(selectedImage ?? '')
                    ? (selectedImage ?? undefined)
                    : (asset(selectedImage ?? '') ?? undefined)
                }
              />
            </figure>
          </Modal>
        ) : null}
      </>
    );
  },
);
