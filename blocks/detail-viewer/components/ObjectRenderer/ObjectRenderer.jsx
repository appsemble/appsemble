import PropTypes from 'prop-types';
import React from 'react';
import {
  SchemaRenderer,
} from 'react-schema-renderer';


/**
 * Render a JSON schema object as a definition list.
 */
export default class ObjectRenderer extends React.Component {
  static propTypes = {
    /**
     * The name of the property to render.
     */
    name: PropTypes.string,
    /**
     * The schema to render.
     */
    schema: PropTypes.shape().isRequired,
    /**
     * The current value.
     */
    value: PropTypes.shape(),
  };

  static defaultProps = {
    name: null,
    value: {},
  };

  render() {
    const {
      name,
      schema,
      value,
      ...props
    } = this.props;

    return (
      <dl {...props}>
        {Object.entries(schema.properties).map(([subName, subSchema]) => (
          <SchemaRenderer
            key={subName}
            name={subName}
            schema={subSchema}
            value={value[subName]}
          />
        ))}
      </dl>
    );
  }
}
