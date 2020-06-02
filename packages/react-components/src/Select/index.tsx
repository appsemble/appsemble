import classNames from 'classnames';
import * as React from 'react';

import FormComponent from '../FormComponent';

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
  };

/**
 * A Bulma styled form select element.
 */
export default class Select extends React.Component<SelectProps> {
  onChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const { onChange } = this.props;

    onChange(event, event.target.value);
  };

  render(): React.ReactElement {
    const {
      fullwidth = true,
      className,
      label,
      loading,
      name,
      required,
      id = name,
      ...props
    } = this.props;

    return (
      <FormComponent className={className} id={id} label={label} required={required}>
        <div className={classNames('select', { 'is-fullwidth': fullwidth, 'is-loading': loading })}>
          <select
            {...props}
            className={classNames({ 'is-fullwidth': fullwidth })}
            id={id}
            name={name}
            onChange={this.onChange}
            required={required}
          />
        </div>
      </FormComponent>
    );
  }
}
