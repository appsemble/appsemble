import type { IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import React, {
  ChangeEvent,
  ComponentPropsWithoutRef,
  forwardRef,
  ReactElement,
  ReactNode,
  useCallback,
} from 'react';

import { FormComponent, Icon } from '..';

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

    /**
     * The icon of the select element.
     */
    icon?: IconName;
  };

/**
 * A Bulma styled form select element.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
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
      icon,
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
      <FormComponent
        className={className}
        iconLeft={icon}
        id={id}
        label={label}
        required={required}
      >
        <div className={classNames('select', { 'is-fullwidth': fullwidth, 'is-loading': loading })}>
          <select
            {...props}
            className={classNames({ 'is-fullwidth': fullwidth })}
            id={id}
            name={name}
            onChange={handleChange}
            ref={ref}
            required={required}
          />
        </div>
        {icon && <Icon className="is-left" icon={icon} />}
        {help && <div className="help">{help}</div>}
      </FormComponent>
    );
  },
);
