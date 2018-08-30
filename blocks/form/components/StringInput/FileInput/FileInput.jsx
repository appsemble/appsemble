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

  state = {
    // This is actually used in onSelect.
    // eslint-disable-next-line react/no-unused-state
    value: null,
  };

  onSelect = ({ target }) => {
    // XXX Synchronize the value to the state to prevent the same event to be fired twice because of
    // the shadow DOM hackery.
    this.setState(({ value }, { onChange }) => {
      const [file] = target.files;
      if (file === value) {
        return undefined;
      }
      readBlob(file, 'dataurl')
        .then(dataurl => onChange({ target }, dataurl));
      return {
        value: file,
      };
    });
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
