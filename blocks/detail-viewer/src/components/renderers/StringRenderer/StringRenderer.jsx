import PropTypes from 'prop-types';
import React from 'react';

/**
 * An element for a text type schema.
 */
export default class StringRenderer extends React.Component {
  static propTypes = {
    /**
     * Structure used to define this field.
     */
    field: PropTypes.shape().isRequired,

    /**
     * The current value.
     */
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.shape()]),
  };

  static defaultProps = {
    value: '',
  };

  render() {
    const { field, value } = this.props;

    return (
      <React.Fragment>
        <h6 className="title is-6">{field.label || field.name}</h6>
        <div className="content">{typeof value === 'string' ? value : JSON.stringify(value)}</div>
      </React.Fragment>
    );
  }
}
