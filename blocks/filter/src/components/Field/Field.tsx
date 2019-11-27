import classNames from 'classnames';
import React from 'react';
import { WrappedComponentProps } from 'react-intl';

import { Filter, FilterField, RangeFilter } from '../../../types';
import CheckBoxField from '../CheckBoxField';
import DateField from '../DateField';
import EnumField from '../EnumField';
import StringField from '../StringField';
import styles from './Field.css';
import messages from './messages';

export interface FieldProps extends WrappedComponentProps {
  displayLabel?: boolean;
  filter: Filter;
  loading: boolean;
  onChange:
    | React.ChangeEventHandler<HTMLInputElement>
    | React.ChangeEventHandler<HTMLSelectElement>;
  onRangeChange:
    | React.ChangeEventHandler<HTMLInputElement>
    | React.ChangeEventHandler<HTMLSelectElement>;
  onCheckBoxChange?:
    | React.ChangeEventHandler<HTMLInputElement>
    | React.ChangeEventHandler<HTMLSelectElement>;
}

export default class Field extends React.Component<FieldProps & FilterField> {
  static defaultProps: Partial<FieldProps & FilterField> = {
    displayLabel: true,
    emptyLabel: '',
    label: undefined,
    range: false,
    type: null,
    icon: undefined,
  };

  generateField = (): React.ReactNode => {
    const {
      enum: enumerator,
      type,
      range,
      onRangeChange,
      onCheckBoxChange,
      intl,
      filter,
      onChange,
      displayLabel,
      emptyLabel,
      ...props
    } = this.props;

    const { name } = this.props;

    if (enumerator) {
      switch (type) {
        case 'checkbox':
          return (
            <CheckBoxField
              enumerator={enumerator}
              onChange={onCheckBoxChange}
              value={filter[name] as string[]}
              {...props}
            />
          );
        default:
          return (
            <EnumField
              defaultValue={props.defaultValue}
              emptyLabel={emptyLabel}
              enumerator={enumerator}
              onChange={onChange}
              value={filter[name]}
              {...props}
            />
          );
      }
    } else {
      switch (type) {
        case 'date':
          return range ? (
            <>
              <DateField
                id={`from${name}`}
                name={name}
                onChange={onRangeChange}
                placeholder={intl.formatMessage(messages.from)}
                value={filter[name] && (filter[name] as RangeFilter).from}
                {...props}
              />
              <DateField
                id={`to${name}`}
                name={name}
                onChange={onRangeChange}
                placeholder={intl.formatMessage(messages.to)}
                value={filter[name] && (filter[name] as RangeFilter).to}
                {...props}
              />
            </>
          ) : (
            <DateField
              id={`from${name}`}
              name={name}
              onChange={onRangeChange}
              placeholder={intl.formatMessage(messages.from)}
              value={filter[name] && (filter[name] as RangeFilter).from}
              {...props}
            />
          );
        default:
          return (
            <StringField
              className={styles.control}
              name={name}
              onChange={onChange}
              value={filter[name]}
              {...props}
            />
          );
      }
    }
  };

  render(): JSX.Element {
    const { displayLabel, name, range, label = name, icon } = this.props;

    const Control = this.generateField();

    return (
      <div className="field ">
        {displayLabel && (
          <label className="label" htmlFor={`filter${name}`}>
            {icon && (
              <span className="icon">
                <i className={`fas fa-${icon}`} />
              </span>
            )}
            {label}
          </label>
        )}
        <div className={classNames('field', { 'is-grouped': range })}>{Control}</div>
      </div>
    );
  }
}
