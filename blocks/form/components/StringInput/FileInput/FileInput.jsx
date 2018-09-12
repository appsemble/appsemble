import {
  FileField,
  FileLabel,
  Image,
} from '@appsemble/react-bulma';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';


function getDerivedStateFromProps({ value }, state) {
  if (value === state.value) {
    return null;
  }
  URL.revokeObjectURL(state.url);
  if (value instanceof Blob) {
    return {
      url: URL.createObjectURL(value),
      value,
    };
  }
  return {
    url: value,
    value,
  };
}


export default class FileInput extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    schema: PropTypes.shape().isRequired,
    value: PropTypes.oneOfType([
      PropTypes.instanceOf(Blob),
      PropTypes.string,
    ]),
  };

  static defaultProps = {
    value: null,
  };

  state = getDerivedStateFromProps(this.props, {});

  static getDerivedStateFromProps = getDerivedStateFromProps;

  inputRef = (node) => {
    if (node == null) {
      return;
    }

    // XXX A native event listener is used, to prevent the same event to be fired twice because of
    // the shadow DOM hackery.
    node.addEventListener('change', ({ target }) => {
      const {
        onChange,
      } = this.props;
      const [file] = target.files;
      onChange({ target }, file);
    });
  };

  render() {
    const {
      name,
      schema,
    } = this.props;
    const {
      url,
    } = this.state;

    const title = schema.description || schema.title || name;
    const {
      type = [],
    } = schema.appsembleFile;

    return (
      <FileField
        accept={[].concat(type).toString()}
        FileInputProps={{
          innerRef: this.inputRef,
        }}
        name={name}
      >
        {url ? (
          <Image
            alt={title}
            size={128}
            src={url}
          />
        ) : (
          <FileLabel>
            <FormattedMessage {...messages.clickAction} />
          </FileLabel>
        )}
      </FileField>
    );
  }
}
