import classNames from 'classnames';
import React, {
  ChangeEvent,
  cloneElement,
  ComponentPropsWithoutRef,
  forwardRef,
  isValidElement,
  ReactElement,
  ReactNode,
  useCallback,
} from 'react';

import { FormComponent, Icon } from '..';
import styles from './index.css';

type TextAreaProps = Omit<ComponentPropsWithoutRef<typeof FormComponent>, 'children'> &
  Omit<ComponentPropsWithoutRef<'textarea'>, 'label' | 'onChange'> & {
    control?: ReactElement;

    /**
     * An error message to render.
     */
    error?: ReactNode;

    /**
     * A help message to render.
     */
    help?: ReactNode;

    /**
     * The name of the HTML element.
     */
    name: string;

    /**
     * This is fired when the input value has changed.
     */
    onChange: (event: ChangeEvent<HTMLTextAreaElement>, value: string) => void;
  };

/**
 * A Bulma styled textarea element.
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      control,
      error,
      iconLeft,
      help,
      label,
      maxLength,
      name,
      onChange,
      required,
      value,
      id = name,
      ...props
    },
    ref,
  ) => {
    const handleChange = useCallback(
      (event: ChangeEvent<HTMLTextAreaElement>) => {
        onChange(event, event.currentTarget.value);
      },
      [onChange],
    );

    return (
      <FormComponent
        iconLeft={iconLeft}
        iconRight={Boolean(control)}
        id={id}
        label={label}
        required={required}
      >
        <textarea
          {...props}
          className={classNames('textarea', { 'is-danger': error })}
          id={id}
          maxLength={maxLength}
          name={name}
          onChange={handleChange}
          ref={ref}
          required={required}
          value={value}
        />
        {iconLeft && <Icon className="is-left" icon={iconLeft} />}
        {control && cloneElement(control, { className: 'is-right' })}
        <div className={`${styles.help} is-flex`}>
          <p className={classNames('help', { 'is-danger': error })}>
            {isValidElement(error) ? error : help}
          </p>
          {maxLength ? (
            <span className={`help ml-1 ${styles.counter}`}>
              {value == null ? 0 : String(value).length} / {maxLength}
            </span>
          ) : null}
        </div>
      </FormComponent>
    );
  },
);
