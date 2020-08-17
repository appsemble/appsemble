import axios from 'axios';

export async function download(url: string, filename: string, accept?: string): Promise<void> {
  const { data, headers } = await axios.get(url, {
    responseType: 'blob',
    ...(accept != null && {
      headers: {
        accept,
      },
    }),
  });

  const downloadUrl = URL.createObjectURL(
    new Blob([data], { type: headers['content-type']?.match(/^\w+\/\w+/)?.[0] }),
  );
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(downloadUrl);
}
