import {
  Icon,
} from '@appsemble/react-bulma';
import PropTypes from 'prop-types';
import React from 'react';

import Definition from '../Definition';


/**
 * A renderer which represents a boolean value using a checked or unchecked checkbox icon.
 */
export default class BooleanRenderer extends React.Component {
  static propTypes = {
    /**
     * The current value.
     */
    value: PropTypes.bool,
  };

  static defaultProps = {
    value: false,
  };

  render() {
    const {
      value,
      ...props
    } = this.props;

    return (
      <Definition {...props}>
        <Icon fa={value ? 'check-square' : 'square'} />
      </Definition>
    );
  }
}
