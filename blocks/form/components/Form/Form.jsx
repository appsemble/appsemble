import {
  Button,
} from '@appsemble/react-bulma';
import PropTypes from 'prop-types';
import React from 'react';
import {
  FormattedMessage,
} from 'react-intl';
import {
  SchemaRenderer,
} from 'react-schema-renderer';

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
    submitting: false,
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
    event.preventDefault();

    this.setState(({ submitting, value }) => {
      if (!submitting) {
        onSubmit(event, value)
          .then(() => {
            this.setState({
              submitting: false,
            });
          }, (error) => {
            this.setState({
              submitting: false,
            });
            throw error;
          });
      }
      return {
        submitting: true,
      };
    });
  };

  render() {
    const {
      schema,
    } = this.props;
    const {
      submitting,
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
        <Button className={styles.submit} color="primary" disabled={submitting} type="submit">
          <FormattedMessage {...messages.submit} />
        </Button>
      </SchemaRenderer>
    );
  }
}
