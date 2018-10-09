import { Icon } from '@appsemble/react-bulma';
import PropTypes from 'prop-types';
import React from 'react';

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
    const { value } = this.props;

    return <Icon fa={value ? 'check-square' : 'square'} />;
  }
}
