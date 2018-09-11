import PropTypes from 'prop-types';
import React from 'react';

import Definition from '../Definition';


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
      ...props
    } = this.props;

    return (
      <Definition {...props}>
        <p>
          {value}
        </p>
      </Definition>
    );
  }
}
