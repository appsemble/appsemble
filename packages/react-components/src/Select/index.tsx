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

type SelectProps = ComponentPropsWithoutRef<typeof FormComponent> &
  Omit<ComponentPropsWithoutRef<'select'>, 'onChange'> & {
    /**
     * The name of the HTML element.
     */
    name: string;

    /**
     * This is fired when the input value has changed.
     */
    onChange: (event: ChangeEvent<HTMLSelectElement>, value: string) => void;

    /**
     * Indicate the select box is in a loading state.
     */
    loading?: boolean;

    /**
     * Wether or not the element should take as much space it can.
     */
    fullwidth?: boolean;

    /**
     * A help message to render.
     */
    help?: ReactNode;
  };

/**
 * A Bulma styled form select element.
 */
export default forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      fullwidth = true,
      className,
      help,
      label,
      loading,
      name,
      onChange,
      required,
      id = name,
      ...props
    },
    ref,
  ): ReactElement => {
    const handleChange = useCallback(
      (event: ChangeEvent<HTMLSelectElement>) => {
        onChange(event, event.currentTarget.value);
      },
      [onChange],
    );

    return (
      <FormComponent className={className} id={id} label={label} required={required}>
        <div className={classNames('select', { 'is-fullwidth': fullwidth, 'is-loading': loading })}>
          <select
            {...props}
            ref={ref}
            className={classNames({ 'is-fullwidth': fullwidth })}
            id={id}
            name={name}
            onChange={handleChange}
            required={required}
          />
        </div>
        {help && <div className="help">{help}</div>}
      </FormComponent>
    );
  },
);
