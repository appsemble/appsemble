import { ChangeEvent, ComponentPropsWithoutRef, forwardRef, ReactNode, useCallback } from 'react';

import { FormComponent, Icon, Input, SharedFormComponentProps } from '..';

type FileUploadProps = Omit<
  ComponentPropsWithoutRef<typeof Input>,
  keyof SharedFormComponentProps
> &
  SharedFormComponentProps & {
    fileButtonLabel?: ReactNode;
    fileLabel?: ReactNode;
    preview?: ReactNode;
    onChange: (event: ChangeEvent<HTMLInputElement>, value: File) => void;
    formComponentClassName?: string;
  };

export const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
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
    },
    ref,
  ) => {
    const handleChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => onChange(event, event.currentTarget.files[0]),
      [onChange],
    );

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
              onChange={handleChange}
              ref={ref}
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
  },
);
