import classNames from 'classnames';
import React, {
  ChangeEvent,
  ComponentPropsWithoutRef,
  forwardRef,
  ReactElement,
  ReactNode,
  useCallback,
} from 'react';

import FormComponent from '../FormComponent';

type CheckboxProps = Omit<ComponentPropsWithoutRef<typeof FormComponent>, 'children'> &
  Omit<ComponentPropsWithoutRef<'input'>, 'value' | 'label' | 'onChange'> & {
    error?: any;

    /**
     * The name of the HTML element.
     */
    name: string;

    /**
     * A help message to render next to the checkbox.
     */
    help?: ReactNode;

    /**
     * This is fired when the input value has changed.
     */
    onChange: (event: ChangeEvent<HTMLInputElement>, value: boolean) => void;

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
export default forwardRef<HTMLInputElement, CheckboxProps>(
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
      rtl,
      ...props
    },
    ref,
  ): ReactElement => {
    const handleChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        onChange(event, event.target.checked);
      },
      [onChange],
    );

    return (
      <FormComponent className={wrapperClassName} id={id} label={label} required>
        <input
          {...props}
          ref={ref}
          checked={value}
          className={classNames(
            isSwitch ? 'switch' : 'is-checkradio',
            { 'is-rtl': rtl },
            className,
          )}
          id={id}
          name={name}
          onChange={handleChange}
          type="checkbox"
        />
        <label className={classNames({ 'is-danger': error })} htmlFor={id}>
          {help}
        </label>
      </FormComponent>
    );
  },
);
