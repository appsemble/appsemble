import { getFilenameFromContentDisposition } from '@appsemble/utils';
import { type VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import styles from './index.module.css';
import { Icon } from '../Icon/index.js';

const appAssetPattern = /^(?:https?:\/\/[^/]+)?\/api\/apps\/\d+\/assets\/[^#/?]+/;

function getOriginalAssetURL(url: string): string {
  return `${url.split(/[#?]/)[0]}/download`;
}

async function downloadAsset(url: string): Promise<void> {
  const response = await fetch(url);
  const blob = await response.blob();
  const objectURL = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.download = getFilenameFromContentDisposition(response.headers.get('Content-Disposition')!)!;
  link.href = objectURL;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectURL);
}

interface AppAssetDownloadButtonProps {
  /**
   * The accessible label and tooltip of the button.
   */
  readonly label: string;

  readonly src: string;
}

export function AppAssetDownloadButton({ label, src }: AppAssetDownloadButtonProps): VNode | null {
  const downloadUrl = appAssetPattern.test(src) ? getOriginalAssetURL(src) : null;

  const handleDownloadClick = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();

      if (downloadUrl) {
        downloadAsset(downloadUrl);
      }
    },
    [downloadUrl],
  );

  return downloadUrl ? (
    <button
      aria-label={label}
      className={styles.root}
      onClick={handleDownloadClick}
      title={label}
      type="button"
    >
      <Icon icon="download" />
    </button>
  ) : null;
}
