import classNames from 'classnames';
import * as React from 'react';

import FormComponent from '../FormComponent';
import MarkdownContent from '../MarkdownContent';

type SelectProps = React.ComponentPropsWithoutRef<typeof FormComponent> &
  Omit<React.ComponentPropsWithoutRef<'select'>, 'onChange'> & {
    /**
     * The name of the HTML element.
     */
    name: string;

    /**
     * This is fired when the input value has changed.
     */
    onChange: (event: React.ChangeEvent<HTMLSelectElement>, value: string) => void;

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
    help?: string;
  };

/**
 * A Bulma styled form select element.
 */
export default React.forwardRef<HTMLSelectElement, SelectProps>(
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
  ): React.ReactElement => {
    const handleChange = React.useCallback(
      (event: React.ChangeEvent<HTMLSelectElement>) => {
        onChange(event, event.target.value);
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
        <MarkdownContent className="help" content={help} />
      </FormComponent>
    );
  },
);
