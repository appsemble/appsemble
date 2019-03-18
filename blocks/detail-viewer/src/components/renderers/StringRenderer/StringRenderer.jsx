import { Content, Label } from '@appsemble/react-bulma';
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
        <Label>{field.label || field.name}</Label>
        <Content>{typeof value === 'string' ? value : JSON.stringify(value)}</Content>
      </React.Fragment>
    );
  }
}
