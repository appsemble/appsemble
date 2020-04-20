import uploadBlobs from '@appsemble/app/src/utils/uploadBlobs';
import type { BlobUploadType } from '@appsemble/types';
import type { OpenAPIV3 } from 'openapi-types';
import * as React from 'react';

import FileEntry from '../FileEntry';
import styles from './index.css';

interface FileInputProps {
  value: string[];
  prop: OpenAPIV3.SchemaObject;
  propName: string;
  disabled: boolean;
  onInput: (event: Event, val: string) => void;
  repeated: boolean;
}

export default function FileInput({
  disabled,
  onInput,
  prop,
  propName,
  repeated,
  value,
}: FileInputProps): React.ReactElement {
  const onSelect = React.useCallback(
    async (event: Event, val: string | Blob): Promise<void> => {
      const copy = [].concat(value);
      const index = Number((event.target as HTMLInputElement).name.split('.').pop());
      if (val == null) {
        copy.splice(index, 1);
      } else {
        copy[index] = val;
      }

      // /todo
      const blobUploadType: BlobUploadType = {
        method: 'POST',
        serialize: null,
        url: 'http://localhost:9999/api/apps/5/assets',
      };

      const result = (await uploadBlobs(copy[0], blobUploadType)) as string;

      onInput(({ target: { name: propName } } as any) as Event, result);
    },
    [onInput, propName, value],
  );

  return repeated ? (
    <div className={styles.repeatedContainer}>
      <FileEntry disabled={disabled} onInput={onSelect} prop={prop} />
      {(value as string[]).map((val, index) => (
        <FileEntry
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          onInput={onSelect}
          prop={prop}
          propName={propName}
          value={val}
        />
      ))}
    </div>
  ) : (
    <FileEntry onInput={onSelect} prop={prop} propName={propName} value={value[0]} />
  );
}
