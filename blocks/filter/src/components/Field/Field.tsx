import classNames from 'classnames';
import React from 'react';
import { InjectedIntlProps } from 'react-intl';

import { Filter, FilterField, RangeFilter } from '../../../types';
import Control from '../Control';
import styles from './Field.css';
import messages from './messages';

export interface FieldProps {
  displayLabel?: boolean;
  filter: Filter;
  loading: boolean;
  onChange:
    | React.ChangeEventHandler<HTMLInputElement>
    | React.ChangeEventHandler<HTMLSelectElement>;
  onRangeChange:
    | React.ChangeEventHandler<HTMLInputElement>
    | React.ChangeEventHandler<HTMLSelectElement>;
}

export default class Field extends React.Component<FieldProps & FilterField & InjectedIntlProps> {
  static defaultProps: Partial<FieldProps & FilterField> = {
    displayLabel: true,
    label: undefined,
    range: false,
    type: null,
    icon: undefined,
  };

  render(): JSX.Element {
    const {
      displayLabel,
      filter,
      intl,
      name,
      onRangeChange,
      onChange,
      range,
      label = name,
      icon,
      ...props
    } = this.props;

    return (
      <div className="field is-horizontal">
        {displayLabel && (
          <div className="field-label is-normal">
            <label className="label" htmlFor={`filter${name}`}>
              {icon && (
                <span className="icon">
                  <i className={`fas fa-${icon}`} />
                </span>
              )}
              {label}
            </label>
          </div>
        )}
        <div className={classNames('field field-body', { 'is-grouped': range })}>
          {range ? (
            <React.Fragment>
              <Control
                id={`from${name}`}
                name={name}
                onChange={onRangeChange}
                placeholder={intl.formatMessage(messages.from)}
                value={filter[name] && (filter[name] as RangeFilter).from}
                {...props}
              />
              <Control
                id={`to${name}`}
                name={name}
                onChange={onRangeChange}
                placeholder={intl.formatMessage(messages.to)}
                value={filter[name] && (filter[name] as RangeFilter).to}
                {...props}
              />
            </React.Fragment>
          ) : (
            <Control
              className={styles.control}
              name={name}
              onChange={onChange}
              value={filter[name]}
              {...props}
            />
          )}
        </div>
      </div>
    );
  }
}
