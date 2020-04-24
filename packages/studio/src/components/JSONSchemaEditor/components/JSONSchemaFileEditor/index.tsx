import uploadBlobs from '@appsemble/app/src/utils/uploadBlobs';
import { FileUpload, FormComponent } from '@appsemble/react-components';
import type { BlobUploadType } from '@appsemble/types';
import type { OpenAPIV3 } from 'openapi-types';
import * as React from 'react';

interface JSONSchemaFileEditorProps {
  /**
   * The name of the property thas is being rendered.
   *
   * The name is determined by the parent schema. It is used for recursion.
   */
  name?: string;

  /**
   * Whether or not the property is required.
   *
   * This is determined by the parent schema. It is used for recursion.
   */
  required?: boolean;

  /**
   * The handler that is called whenever a value changes.
   */
  onChange: (name: any, value?: any) => void;

  /**
   * The properties of the schema object.
   */
  prop: OpenAPIV3.SchemaObject;

  /**
   * The label rendered above the input field.
   */
  label: string | React.ReactElement;
}

export default function JSONSchemaFileEditor({
  label,
  name,
  onChange,
  prop,
  required,
}: JSONSchemaFileEditorProps): React.ReactElement {
  let acceptedFiles = 'file_extension';

  const [files, setFiles] = React.useState<File[]>([null]);
  const [fileResults, setFileResults] = React.useState<string[]>([]);
  const blobUploadType: BlobUploadType = {
    method: 'POST',
    serialize: null,
    url: '/api/apps/5/assets',
  };

  const onFileChange = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
      e.persist();
      const selectedFile = e.target.files[0];
      const index = Number(key);
      const val = [].concat(selectedFile);
      const filesState = files;
      const fileResultState = fileResults;
      if (val[0] !== undefined) {
        const result = (await uploadBlobs(val, blobUploadType)) as string;
        const resultValue = result[0];
        if (index + 1 === files.length) {
          setFiles([selectedFile, ...files]);
          fileResultState[index] = resultValue;
          setFileResults(fileResultState);
        } else {
          filesState[index] = selectedFile;
          setFiles(filesState);
          fileResultState[index] = resultValue;
          setFileResults(fileResultState);
        }
      } else {
        filesState.splice(index, 1);
        setFiles(filesState);
        fileResultState.splice(index, 1);
        setFileResults(fileResultState);
      }

      onChange(e, fileResults);
    },
    [files, fileResults, onChange, blobUploadType],
  );

  if (prop.type === 'array') {
    if (prop.items) {
      Object.entries(prop.items).forEach(([key, object]) => {
        if (key === 'appsembleFile' && object) {
          acceptedFiles = object.type;
        }
      });
    }
  }

  return (
    <FormComponent label={label} required={required}>
      {Object.entries(files).map(([key, file]) => (
        <FileUpload
          key={key}
          accept={acceptedFiles}
          fileButtonLabel="Choose file"
          fileLabel={file?.name || 'no file'}
          name={name}
          onChange={(event) => onFileChange(event, key)}
        />
      ))}
    </FormComponent>
  );
}
