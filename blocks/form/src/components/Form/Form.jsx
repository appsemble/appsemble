import {
  Button,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';
import {
  FormattedMessage,
} from 'react-intl';

import SchemaRenderer from '../SchemaRenderer';
import styles from './Form.css';
import messages from './messages';


/**
 * Render Material UI based a form based on a JSON schema
 */
export default class Form extends React.Component {
  static propTypes = {
    /**
     * A callback which will be called when the form is submitted.
     */
    onSubmit: PropTypes.func.isRequired,
    /**
     * The enum schema definition for which to render an input.
     */
    schema: PropTypes.shape().isRequired,
  };

  state = {
    value: {},
  };

  onChange = (event, value) => {
    this.setState({
      value,
    });
  };

  onSubmit = (event) => {
    const {
      onSubmit,
    } = this.props;
    const {
      value,
    } = this.state;

    if (!event.defaultPrevented) {
      event.preventDefault();
      onSubmit(event, value);
    }
  };

  render() {
    const {
      schema,
    } = this.props;
    const {
      value,
    } = this.state;

    return (
      <SchemaRenderer
        className={styles.root}
        component="form"
        noValidate
        onChange={this.onChange}
        onSubmit={this.onSubmit}
        schema={schema}
        value={value}
      >
        <Button className={styles.submit} color="primary" type="submit">
          <FormattedMessage {...messages.submit} />
        </Button>
      </SchemaRenderer>
    );
  }
}
