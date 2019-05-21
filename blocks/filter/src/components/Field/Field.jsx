import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import Control from '../Control';
import messages from './messages';

export default class Field extends React.Component {
  static propTypes = {
    displayLabel: PropTypes.bool,
    filter: PropTypes.shape().isRequired,
    icon: PropTypes.string,
    intl: PropTypes.shape().isRequired,
    label: PropTypes.node,
    name: PropTypes.node.isRequired,
    onChange: PropTypes.func.isRequired,
    onRangeChange: PropTypes.func.isRequired,
    type: PropTypes.string,
    range: PropTypes.bool,
  };

  static defaultProps = {
    displayLabel: true,
    label: undefined,
    range: false,
    type: null,
    icon: undefined,
  };

  render() {
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
                value={filter[name]?.from}
                {...props}
              />
              <Control
                id={`to${name}`}
                name={name}
                onChange={onRangeChange}
                placeholder={intl.formatMessage(messages.to)}
                value={filter[name]?.to}
                {...props}
              />
            </React.Fragment>
          ) : (
            <Control name={name} onChange={onChange} value={filter[name]} {...props} />
          )}
        </div>
      </div>
    );
  }
}
