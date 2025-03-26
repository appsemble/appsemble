import {
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  forwardRef,
  type ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';

import { FormComponent, Icon, type Input, type SharedFormComponentProps } from '../index.js';

type FileUploadProps = Omit<
  ComponentPropsWithoutRef<typeof Input>,
  keyof SharedFormComponentProps | 'onChange' | 'value'
> &
  SharedFormComponentProps & {
    readonly fileButtonLabel?: ReactNode;
    readonly fileLabel?: ReactNode;
    readonly preview?: ReactNode;
    readonly onChange: (event: ChangeEvent<HTMLInputElement>, value: File) => void;
    readonly formComponentClassName?: string;
    readonly value?: File;
    readonly handleRemove?: () => void;
    readonly hasPicture?: boolean;
  };

export const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      capture,
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
      value,
      handleRemove,
      hasPicture = false,
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);

    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
    // @ts-ignore 2322 null is not assignable to type (strictNullChecks)
    useImperativeHandle(ref, () => inputRef.current);

    const handleChange = useCallback(
      // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
      // @ts-ignore 2322 null is not assignable to type (strictNullChecks)
      (event: ChangeEvent<HTMLInputElement>) => onChange(event, event?.currentTarget.files?.[0]),
      [onChange],
    );

    useEffect(() => {
      // Make sure the input is cleared when the value is cleared.
      if (!value) {
        // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
        // @ts-ignore 2322 null is not assignable to type (strictNullChecks)
        inputRef.current.value = null;
      }
    }, [value, inputRef]);

    const fileName = value?.name || fileLabel;

    const handleRemoveClick = (): void => {
      handleRemove();
      inputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    };

    return (
      <FormComponent className={formComponentClassName} id={id} label={label} required={required}>
        {preview}
        <div className="file has-name">
          <label className={`file-label ${className}`} htmlFor={id}>
            <input
              accept={accept}
              capture={capture}
              className="file-input"
              id={id}
              name={name}
              onChange={handleChange}
              ref={inputRef}
              type="file"
            />
            <span className="file-cta">
              <Icon icon={icon} />
              {fileButtonLabel ? <span className="file-label">{fileButtonLabel}</span> : null}
            </span>
            {fileName ? <span className="file-name">{fileName}</span> : null}
          </label>
          {hasPicture ? (
            <button
              className="delete is-medium is-align-self-center ml-2"
              onClick={handleRemoveClick}
              type="button"
            />
          ) : null}
        </div>
        {help ? <p className="help">{help}</p> : null}
      </FormComponent>
    );
  },
);
