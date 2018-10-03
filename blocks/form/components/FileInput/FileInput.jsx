import PropTypes from 'prop-types';
import React from 'react';

import FileEntry from './FileEntry';
import styles from './FileInput.css';


export default class FileInput extends React.Component {
  static propTypes = {
    /**
     * This will be called when a new file has been selected/
     */
    onChange: PropTypes.func.isRequired,
    /**
     * The enum field to render.
     */
    field: PropTypes.shape().isRequired,
    /**
     * The current value.
     */
    value: PropTypes.oneOfType([
      PropTypes.instanceOf(Blob),
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.oneOfType([
        PropTypes.instanceOf(Blob),
        PropTypes.string,
      ])),
    ]),
  };

  static defaultProps = {
    value: [],
  };

  onChange = (event, val) => {
    const {
      field,
      onChange,
      value,
    } = this.props;

    const copy = [...value];
    copy[Number(event.target.name.split('.').pop())] = val;
    onChange({ target: { name: field.name } }, copy);
  };

  render() {
    const {
      field,
      onChange,
      value,
    } = this.props;

    return field.repeated ? (
      <div className={styles.repeatedContainer}>
        {value.map((val, index) => (
          <FileEntry
            field={field}
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            name={`${field.name}.${index}`}
            onChange={this.onChange}
            value={val}
          />
        ))}
        <FileEntry
          field={field}
          name={`${field.name}.${value.length}`}
          onChange={this.onChange}
        />
      </div>
    ) : (
      <FileEntry
        field={field}
        name={field.name}
        onChange={onChange}
        value={value}
      />
    );
  }
}
