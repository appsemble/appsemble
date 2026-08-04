import axios from 'axios';

export async function downloadAsset(url: string, filename: string): Promise<void> {
  const response = await axios.get<Blob>(url, { responseType: 'blob' });
  const objectURL = URL.createObjectURL(response.data);
  const link = document.createElement('a');

  link.download = filename;
  link.href = objectURL;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectURL);
}
