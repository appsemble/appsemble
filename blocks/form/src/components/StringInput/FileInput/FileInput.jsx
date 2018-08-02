import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import readBlob from 'read-blob';

import styles from './FileInput.css';
import messages from './messages';


export default class FileInput extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    schema: PropTypes.shape().isRequired,
    value: PropTypes.string,
  };

  static defaultProps = {
    value: null,
  };

  onSelect = async ({ target }) => {
    const {
      onChange,
    } = this.props;

    // XXX This target extracting and checking is needed because of the shadow DOM hackery.
    if (target != null) {
      const value = await readBlob(target.files[0], 'dataurl');
      onChange({ target }, value);
    }
  };

  render() {
    const {
      name,
      schema,
      value,
    } = this.props;

    const title = schema.description || schema.title || name;
    const {
      type = [],
    } = schema.appsembleFile;

    return (
      <div className={styles.root}>
        {value ? (
          <img
            alt={title}
            className={styles.preview}
            src={value}
          />
        ) : (
          <FormattedMessage {...messages.clickAction} />
        )}
        <input
          accept={[].concat(type).toString()}
          className={styles.input}
          name={name}
          onChange={this.onSelect}
          title={title}
          type="file"
        />
      </div>
    );
  }
}
