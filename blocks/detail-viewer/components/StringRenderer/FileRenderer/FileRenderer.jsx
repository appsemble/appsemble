import {
  Image,
} from '@appsemble/react-bulma';
import React from 'react';
import PropTypes from 'prop-types';


/**
 * Render a string as is.
 */
export default class FileRenderer extends React.Component {
  static propTypes = {
    /**
     * The name of the property to render.
     */
    name: PropTypes.string.isRequired,
    /**
     * The schema of the property to render.
     */
    schema: PropTypes.shape().isRequired,
    /**
     * The current value.
     */
    value: PropTypes.oneOfType([
      PropTypes.instanceOf(Blob),
      PropTypes.string,
    ]),
  };

  static defaultProps = {
    value: null,
  };

  render() {
    const {
      name,
      schema,
      value,
    } = this.props;

    const src = value instanceof Blob ? URL.createObjectURL(value) : value;

    return (
      <Image size={64} src={src} alt={schema.title || name} />
    );
  }
}
