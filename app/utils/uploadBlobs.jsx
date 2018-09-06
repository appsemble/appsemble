import axios from 'axios';

import extractBlobs from './extractBlobs';


export default async function uploadBlobs(data, { method, serialize, url }) {
  switch (serialize) {
    case 'custom': {
      const [, files] = extractBlobs(data);
      if (files.length === 0) {
        return data;
      }
      const fileMap = new Map(await Promise.all(files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const { data: id } = await axios({
          method,
          url,
          data: formData,
        });
        return [file, id];
      })));
      return extractBlobs(data, ::fileMap.get)[0];
    }
    default:
      return data;
  }
}
