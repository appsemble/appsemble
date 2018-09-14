import PropTypes from 'prop-types';
import React from 'react';
import {
  SchemaRenderer,
} from 'react-schema-renderer';

import styles from './ArrayInput.css';


/**
 * An input element for an array type schema.
 */
export default class ArrayInput extends React.Component {
  static propTypes = {
    /**
     * The name of the property to render.
     */
    name: PropTypes.string,
    /**
     * A callback for when the value changes.
     */
    onChange: PropTypes.func.isRequired,
    /**
     * The enum schema definition for which to render an input.
     */
    schema: PropTypes.shape().isRequired,
    /**
     * The current value.
     */
    // eslint-disable-next-line react/forbid-prop-types
    value: PropTypes.array,
  };

  static defaultProps = {
    name: null,
    value: [],
  };

  onChange = (event, val = event.target.value) => {
    const {
      name,
      onChange,
      value,
    } = this.props;

    const copy = [...value];
    copy[event.target.name.split('.').pop()] = val;

    onChange(
      { target: { name } },
      copy,
    );
  };

  render() {
    const {
      name,
      schema,
      value,
    } = this.props;

    return (
      <div className={styles.root}>
        {value.map((v, index) => (
          <SchemaRenderer
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            name={name == null ? index : `${name}.${index}`}
            onChange={this.onChange}
            schema={schema.items}
            value={v}
          />
        ))}
        {(schema.maxItems == null || value.length < schema.maxItems) && (
          <SchemaRenderer
            name={name == null ? value.length : `${name}.${value.length}`}
            onChange={this.onChange}
            schema={schema.items}
          />
        )}
      </div>
    );
  }
}
