import { getFilenameFromContentDisposition } from '@appsemble/utils';
import { type VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import styles from './index.module.css';

const appAssetPattern = /^(?:https?:\/\/[^/]+)?\/api\/apps\/\d+\/assets\/[^#/?]+/;
const downloadTitle = 'Download in HD';

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
  readonly src: string;
}

export function AppAssetDownloadButton({ src }: AppAssetDownloadButtonProps): VNode | null {
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
      aria-label={downloadTitle}
      className={styles.root}
      onClick={handleDownloadClick}
      title={downloadTitle}
      type="button"
    >
      <i className="fas fa-download" />
    </button>
  ) : null;
}
