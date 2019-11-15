import * as React from 'react';

import FormComponent from '../FormComponent';

type SelectProps = React.ComponentPropsWithoutRef<typeof FormComponent> &
  React.ComponentPropsWithoutRef<'select'> & {
    /**
     * The name of the HTML element.
     */
    name: string;

    /**
     * This is fired when the input value has changed.
     */
    onChange: (event: React.ChangeEvent<HTMLSelectElement>, value: string) => void;
  };

/**
 * A Bulma styled form select element.
 */
export default class Select extends React.Component<SelectProps> {
  onChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const { onChange } = this.props;

    onChange(event, event.target.value);
  };

  render(): JSX.Element {
    const { label, name, required, id = name, ...props } = this.props;

    return (
      <FormComponent id={id} label={label} required={required}>
        <div className="select is-fullwidth">
          <select
            {...props}
            className="is-fullwidth"
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
