import { Modal, useToggle } from '@appsemble/preact-components';
import { type VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import styles from './index.module.css';

const downloadTitle = 'Download in HD';

function getOriginalAssetURL(url: string): string {
  return `${url.split('?')[0]}/download`;
}

async function downloadAsset(url: string): Promise<void> {
  const response = await fetch(url);
  const blob = await response.blob();
  const objectURL = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.download = '';
  link.href = objectURL;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectURL);
}

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
  const downloadUrl = getOriginalAssetURL(src);
  const handleDownloadClick = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      downloadAsset(downloadUrl);
    },
    [downloadUrl],
  );

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
        <button
          aria-label={downloadTitle}
          className={styles.download}
          onClick={handleDownloadClick}
          title={downloadTitle}
          type="button"
        >
          <i className="fas fa-download" />
        </button>
        <figure className="image">
          <img alt={alt} src={src} />
        </figure>
      </Modal>
    </>
  );
}
