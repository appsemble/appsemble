import type { IconName } from '@fortawesome/fontawesome-common-types';
import React from 'react';

import { FormComponent, Icon } from '../index';

interface FileUploadProps {
  id?: string;
  name: string;
  accept?: string;
  label?: React.ReactNode;
  fileButtonLabel?: React.ReactNode;
  fileLabel?: React.ReactNode;
  help?: React.ReactNode;
  preview?: React.ReactNode;
  icon?: IconName;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  formComponentClassName?: string;
  className?: string;
  required?: boolean;
}

export default function FileUpload({
  name,
  id = name,
  accept,
  className,
  fileButtonLabel,
  fileLabel,
  formComponentClassName,
  help,
  icon = 'upload',
  label,
  onChange,
  preview = null,
  required = false,
}: FileUploadProps): React.ReactElement {
  return (
    <FormComponent className={formComponentClassName} id={id} label={label} required={required}>
      {preview}
      <div className="file has-name">
        <label className={`file-label ${className}`} htmlFor={id}>
          <input
            accept={accept}
            className="file-input"
            id={id}
            name={name}
            onChange={onChange}
            type="file"
          />
          <span className="file-cta">
            <Icon icon={icon} />
            {fileButtonLabel && <span className="file-label">{fileButtonLabel}</span>}
          </span>
          {fileLabel && <span className="file-name">{fileLabel}</span>}
        </label>
      </div>
      {help && <p className="help">{help}</p>}
    </FormComponent>
  );
}
