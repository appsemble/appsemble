import uploadBlobs from '@appsemble/app/src/utils/uploadBlobs';
import { Checkbox, FileUpload, FormComponent, Input, Select } from '@appsemble/react-components';
import type { BlobUploadType } from '@appsemble/types';
import type { OpenAPIV3 } from 'openapi-types';
import * as React from 'react';
import type { Definition } from 'typescript-json-schema';

interface JSONSchemaEditorProps {
  required?: boolean;
  schema: OpenAPIV3.SchemaObject | Definition;
  prop: OpenAPIV3.SchemaObject;
  propName: string;
  onChange: any;
  label: string | React.ReactElement;
  disabled: boolean;
}

export default function JSONSchemaEditor({
  disabled,
  label,
  onChange,
  prop,
  propName,
  required,
  schema,
}: JSONSchemaEditorProps): React.ReactElement {
  let type: React.ComponentPropsWithoutRef<typeof Input>['type'] = 'text';
  let acceptedFiles = 'file_extension';
  const returnElements: React.ReactElement[] = [];
  const [files, setFiles] = React.useState<File[]>([null]);
  const [fileResults, setFileResults] = React.useState<string[]>([]);
  const blobUploadType: BlobUploadType = {
    method: 'POST',
    serialize: null,
    url: 'http://localhost:9999/api/apps/5/assets',
  };

  const onFileChange = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
      e.persist();
      const selectedFile = e.target.files[0];
      const index = Number(key);
      const value = [].concat(selectedFile);
      const filesState = files;
      const fileResultState = fileResults;

      if (value[0] !== undefined) {
        const result = (await uploadBlobs(value, blobUploadType)) as string;
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

  if (prop.type === 'integer' || prop.type === 'number') {
    type = 'number';
  } else if (prop.format === 'email') {
    type = 'email';
  } else if (prop.format === 'password') {
    type = 'password';
  } else if (prop.format === 'date-time') {
    type = 'date';
  } else if (prop.type === 'array') {
    if (prop.items) {
      Object.entries(prop.items).forEach(([key, object]) => {
        if (key === 'appsembleFile' && object) {
          acceptedFiles = object.type;
        }
      });
    }
  }

  if (prop.enum) {
    return (
      <Select
        defaultValue="default"
        label={
          prop.title ? (
            <>
              {`${prop.title} `}
              <span className="has-text-weight-normal has-text-grey-light">({propName})</span>
            </>
          ) : (
            propName
          )
        }
        name={propName}
        onChange={onChange}
        required={schema?.required?.includes(propName)}
      >
        <option disabled hidden value="default">
          Choose here
        </option>
        {prop.enum.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    );
  }

  switch (prop.type) {
    case 'array':
      Object.entries(files).forEach(([key, file]) => {
        returnElements.push(
          <FileUpload
            key={key}
            accept={acceptedFiles}
            fileButtonLabel="Choose file"
            fileLabel={file?.name || 'no file'}
            name={propName}
            onChange={(event) => onFileChange(event, key)}
          />,
        );
      });

      return (
        <div>
          <FormComponent label={label} required={required}>
            {returnElements.map((element: React.ReactElement) => element)}
          </FormComponent>
        </div>
      );
    case 'boolean':
      return (
        <Checkbox
          help={propName}
          label={
            prop.title ? (
              <>
                {`${prop.title} `}
                <span className="has-text-weight-normal has-text-grey-light">({propName})</span>
              </>
            ) : (
              propName
            )
          }
          name={propName}
          onChange={onChange}
        />
      );
    case 'object':
      Object.entries(prop.properties).forEach(([key, object]) => {
        const objectProp = object as OpenAPIV3.SchemaObject;

        returnElements.push(
          <JSONSchemaEditor
            key={key}
            disabled={prop.readOnly || key === 'id'}
            label={
              prop.title ? (
                <>
                  {`${key} `}
                  <span className="has-text-weight-normal has-text-grey-light">({prop.title})</span>
                </>
              ) : (
                key
              )
            }
            onChange={(event: React.ChangeEvent<HTMLInputElement>, value: string) =>
              onChange(event, value, prop.type, propName)
            }
            prop={objectProp}
            propName={key}
            required={prop?.required?.includes(key)}
            schema={schema}
          />,
        );
      });

      return <div>{returnElements.map((element: React.ReactElement) => element)}</div>;
    case 'string':
    case 'number':
      return (
        <Input
          disabled={disabled}
          label={label}
          name={propName}
          onChange={(event, value) => {
            onChange(event, value, type);
          }}
          placeholder={prop.example}
          required={required}
          type={type}
        />
      );
    default:
      return null;
  }
}
