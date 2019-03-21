import axios from 'axios';

import extractBlobs from './extractBlobs';

export default async function uploadBlobs(data, { method, serialize, url }) {
  switch (serialize) {
    case 'custom': {
      const [, files] = extractBlobs(data);
      if (files.length === 0) {
        return data;
      }
      const fileMap = new Map(
        await Promise.all(
          files.map(async file => {
            const formData = new FormData();
            formData.append('file', file);
            const { data: responseData } = await axios({
              method,
              url,
              data: formData,
            });

            const id = responseData instanceof Object ? responseData.id : responseData;
            return [file, id.toString()];
          }),
        ),
      );

      return extractBlobs(data, ::fileMap.get)[0];
    }
    default: {
      const [, files] = extractBlobs(data);
      const filesMap = new Map(
        await Promise.all(
          files.map(async file => {
            const { data: responseData } = await axios({
              method,
              url,
              data: file,
              headers: { 'content-type': file.type },
            });
            const id = responseData instanceof Object ? responseData.id : responseData;

            return [file, id.toString()];
          }),
        ),
      );
      return extractBlobs(data, ::filesMap.get)[0];
    }
  }
}
