import axios from 'axios';

/**
 * Download a blob or a string representing file content.
 *
 * @param blob The file content to download.
 * @param filename The filename to save the download as.
 */
export function downloadBlob(blob: Blob | string, filename: string): void {
  const object = typeof blob === 'string' ? new Blob([blob]) : blob;
  const downloadUrl = URL.createObjectURL(object);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(downloadUrl);
}

/**
 * Download a file using the default axios instance.
 *
 * This also uses the Authorization header set for the default axios instance.
 *
 * @param url The URL to download the file from.
 * @param filename The filename to save downloaded file as.
 * @param accept An optional accept header
 */
export async function download(url: string, filename: string, accept?: string): Promise<void> {
  const { data } = await axios.get<Blob>(url, {
    responseType: 'blob',
    headers: { accept },
  });
  downloadBlob(data, filename);
}
