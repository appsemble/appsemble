import PropTypes from 'prop-types';
import React from 'react';

import {
  File,
  FileCta,
  FileInput,
  FileLabel,
} from '../../base';


export default class FileField extends React.Component {
  static propTypes = {
    accept: PropTypes.string,
    boxed: PropTypes.bool,
    FileInputProps: PropTypes.shape(),
    children: PropTypes.node.isRequired,
    name: PropTypes.string,
    onChange: PropTypes.func,
  };

  static defaultProps = {
    accept: null,
    boxed: false,
    FileInputProps: {},
    name: null,
    onChange: null,
  };

  onChange = (event) => {
    const {
      onChange,
    } = this.props;

    onChange(event, event.target.files[0]);
  };

  render() {
    const {
      accept,
      boxed,
      children,
      FileInputProps,
      name,
      onChange,
    } = this.props;

    return (
      <File boxed={boxed}>
        <FileLabel component="label">
          <FileInput
            accept={accept}
            name={name}
            onChange={onChange && this.onChange}
            {...FileInputProps}
          />
          <FileCta>
            {children}
          </FileCta>
        </FileLabel>
      </File>
    );
  }
}
