import {
  Icon,
} from '@material-ui/core';
import {
  CheckBox,
  CheckBoxOutlineBlank,
} from '@material-ui/icons';
import PropTypes from 'prop-types';
import React from 'react';

import Definition from '../Definition';
import messages from './messages';


/**
 * A renderer which represents a boolean value using a checked or unchecked checkbox icon.
 */
export default class BooleanRenderer extends React.Component {
  static propTypes = {
    intl: PropTypes.shape().isRequired,
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
      intl,
      value,
      ...props
    } = this.props;

    return (
      <Definition {...props}>
        <Icon>
          {value ? (
            <CheckBox titleAccess={intl.formatMessage(messages.true)} />
          ) : (
            <CheckBoxOutlineBlank titleAccess={intl.formatMessage(messages.false)} />
          )}
        </Icon>
      </Definition>
    );
  }
}
