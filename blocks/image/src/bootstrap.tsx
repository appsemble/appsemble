import { type BlockProps } from '@appsemble/preact';
import { AppAssetDownloadButton, Icon, Modal, useToggle } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type JSX, type VNode } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';

import defaultPic from './addpicture.svg';
import styles from './index.module.css';

const alignmentClasses = {
  center: styles.alignCenter,
  left: styles.alignLeft,
  right: styles.alignRight,
};

export function ImageBlock({
  actions,
  data: blockData,
  events,
  parameters: {
    alignment = 'center',
    alt: alternate,
    defaultImage = defaultPic,
    fill = false,
    fullscreen = false,
    height = 250,
    input = false,
    name,
    rounded = false,
    url,
    width = 250,
  },
  ready,
  utils: { asset, formatMessage, remap },
}: BlockProps): VNode {
  const [data, setData] = useState(blockData);
  const modal = useToggle();

  useEffect(() => {
    events.on.data((d) => {
      setData(d);
    });

    ready();
  }, [events, ready]);

  const alt = remap(alternate, data) as string;
  const img = remap(url, data) as string;
  const defaultSrc = remap(defaultImage, data) as string;
  const [selectedImage, setSelectedImage] = useState<string | null>(img);

  useEffect(() => {
    setSelectedImage(img);
  }, [img]);

  const selectedSrc = selectedImage
    ? /^(https?:|blob:https?:)?\/\//.test(selectedImage)
      ? selectedImage
      : asset(selectedImage)
    : defaultSrc;

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
    [actions, data, name],
  );

  const figure = (
    <figure>
      <img
        alt={alt}
        className={classNames(styles.img, {
          [styles.placeholder]: !selectedImage,
          [styles.rounded]: rounded,
        })}
        src={selectedSrc}
        // eslint-disable-next-line react/forbid-dom-props
        style={fill ? undefined : { height: `${height}px`, width: `${width}px` }}
      />
    </figure>
  );

  return (
    <>
      <div className={classNames('is-flex', alignmentClasses[alignment])}>
        <div className={fill ? styles.fill : styles.imageScannerWrapper}>
          {fullscreen ? (
            <button onClick={modal.enable} type="button">
              {figure}
            </button>
          ) : (
            figure
          )}
          {input ? (
            <label
              aria-label={formatMessage('changeImage')}
              className={styles.fileLabel}
              for="fileInput"
            >
              <Icon icon="pen" size="small" />
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
          <AppAssetDownloadButton src={selectedSrc} />
          <figure className="image">
            <img
              alt={alt}
              className={styles.fullscreenImage}
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
}
