import classNames from 'classnames';
import React, {
  ChangeEvent,
  ComponentPropsWithoutRef,
  forwardRef,
  ReactElement,
  ReactNode,
  useCallback,
} from 'react';

import { FormComponent } from '..';
import type { SharedFormComponentProps } from '../FormComponent';

type CheckboxFieldProps = SharedFormComponentProps &
  Omit<ComponentPropsWithoutRef<'input'>, 'value' | 'label' | 'onChange' | 'title'> & {
    /**
     * This is fired when the input value has changed.
     */
    onChange: (event: ChangeEvent<HTMLInputElement>, value: boolean) => void;

    /**
     * The title to display right of the checkbox.
     */
    title: ReactNode;

    /**
     * Whether or not the checkbox is checked.
     */
    value?: boolean;

    /**
     * Whether the component should render as a switch or as a square checkbox.
     */
    switch?: boolean;

    /**
     * Whether the label should be displayed to the right of the checkbox or to the left.
     *
     * By default (false), the label will be rendered after the checkbox.
     */
    rtl?: boolean;

    /**
     * The class used for the FormComponent wrapper.
     */
    wrapperClassName?: string;
  };

/**
 * A Bulma styled form select element.
 */
export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  (
    {
      className,
      wrapperClassName,
      error,
      help = null,
      label,
      name,
      onChange,
      value,
      id = name,
      switch: isSwitch,
      title,
      rtl,
      ...props
    },
    ref,
  ): ReactElement => {
    const handleChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        onChange(event, event.currentTarget.checked);
      },
      [onChange],
    );

    return (
      <FormComponent className={wrapperClassName} help={help} id={id} label={label} required>
        <input
          {...props}
          checked={value}
          className={classNames(
            isSwitch ? 'switch' : 'is-checkradio',
            { 'is-rtl': rtl },
            className,
          )}
          id={id}
          name={name}
          onChange={handleChange}
          ref={ref}
          type="checkbox"
        />
        <label className={classNames({ 'is-danger': error })} htmlFor={id}>
          {title}
        </label>
      </FormComponent>
    );
  },
);
