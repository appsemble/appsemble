import uploadBlobs from '@appsemble/app/src/utils/uploadBlobs';
import { Checkbox, FileUpload, FormComponent, Input, Select } from '@appsemble/react-components';
import type { BlobUploadType } from '@appsemble/types';
import type { OpenAPIV3 } from 'openapi-types';
import * as React from 'react';
import type { Definition } from 'typescript-json-schema';

import JSONSchemaArrayEditor from '../JSONSchemaArrayEditor';
import JSONSchemaObjectEditor from '../JSONSchemaObjectEditor';

interface JSONSchemaEditorProps {
  /**
   * Whether or not the editor is disabled.
   *
   * This value is recursively passed down to all child inputs.
   */
  disabled?: boolean;

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
   * The schema used to render the form elements.
   */
  schema: OpenAPIV3.SchemaObject | Definition;

  /**
   * The handler that is called whenever a value changes.
   */
  onChange: (name: any, value?: any) => void;

  /**
   * The value used to populate the editor.
   */
  value: any;
}

export default function JSONSchemaEditor({
  disabled,
  name,
  onChange,
  required,
  schema,
  value,
}: JSONSchemaEditorProps): React.ReactElement {
  let type: React.ComponentPropsWithoutRef<typeof Input>['type'] = 'text';
  let acceptedFiles = 'file_extension';
  const prop = (schema?.properties
    ? schema?.properties[name] || {}
    : schema) as OpenAPIV3.SchemaObject;
  const label = prop.title ? (
    <>
      {`${prop.title} `}
      <span className="has-text-weight-normal has-text-grey-light">({name})</span>
    </>
  ) : (
    name
  );
  let fileUpload = false;
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
          fileUpload = true;
        }
      });
    }
  }

  if (prop.enum) {
    return (
      <Select label={label} name={name} onChange={onChange} required={required} value={value || ''}>
        <option disabled hidden value="">
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

  if (fileUpload) {
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

  switch (prop.type) {
    case 'array':
      return (
        <div>
          {' '}
          <FormComponent label={label} required={required}>
            <JSONSchemaArrayEditor
              name={name}
              onChange={onChange}
              required={required}
              schema={prop.items}
            />
          </FormComponent>
        </div>
      );
    case 'boolean':
      return (
        <Checkbox
          disabled={disabled || prop.readOnly}
          help={name}
          label={label}
          name={name}
          onChange={onChange}
          required={required}
        />
      );
    case 'object':
      return (
        <JSONSchemaObjectEditor
          disabled={disabled}
          name={name}
          onChange={onChange}
          required={required}
          schema={prop.properties}
          value={value}
        />
      );
    case 'string':
    case 'number':
    default:
      return (
        <Input
          disabled={disabled}
          label={label}
          name={name}
          onChange={onChange}
          placeholder={prop.example}
          required={required}
          type={type}
        />
      );
  }
}
