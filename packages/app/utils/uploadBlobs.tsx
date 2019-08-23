import { BlobUploadType } from '@appsemble/types';
import axios, { AxiosResponse } from 'axios';

import extractBlobs, { RecursiveValue } from './extractBlobs';

type IdResponse = AxiosResponse<{ id: string } | string>;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default async function uploadBlobs(
  data: RecursiveValue,
  { method, serialize, url }: BlobUploadType,
) {
  const [, files] = extractBlobs(data);
  if (files.length === 0) {
    return data;
  }
  switch (serialize) {
    case 'custom': {
      const fileMap = new Map(
        await Promise.all(
          files.map(
            async (file): Promise<[Blob, string]> => {
              const formData = new FormData();
              formData.append('file', file);
              const { data: responseData }: IdResponse = await axios({
                method,
                url,
                data: formData,
              });

              const id = responseData instanceof Object ? responseData.id : responseData;
              return [file, `${id}`];
            },
          ),
        ),
      );

      return extractBlobs(data, key => fileMap.get(key))[0];
    }
    default: {
      const filesMap = new Map(
        await Promise.all(
          files.map(
            async (file): Promise<[Blob, string]> => {
              const { data: responseData }: IdResponse = await axios({
                method,
                url,
                data: file,
                headers: { 'content-type': file.type },
              });
              const id = responseData instanceof Object ? responseData.id : responseData;

              return [file, `${id}`];
            },
          ),
        ),
      );
      return extractBlobs(data, key => filesMap.get(key))[0];
    }
  }
}
