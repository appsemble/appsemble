import PropTypes from 'prop-types';
import React from 'react';


/**
 * An number as is.
 */
export default class NumberRenderer extends React.Component {
  static propTypes = {
    /**
     * The current value.
     */
    value: PropTypes.number.isRequired,
  };

  render() {
    const {
      value,
    } = this.props;

    return (
      <p>
        {value}
      </p>
    );
  }
}
