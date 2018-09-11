import {
  Container,
} from '@appsemble/react-bulma';
import PropTypes from 'prop-types';
import React from 'react';
import {
  SchemaRenderer,
} from 'react-schema-renderer';


/**
 * Render a JSON schema object as a definition list.
 */
export default class DefaultRenderer extends React.Component {
  static propTypes = {
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
    value: {},
  };

  render() {
    const {
      schema,
      value,
    } = this.props;

    return (
      <Container>
        {Object.entries(schema.properties).map(([subName, subSchema]) => (
          <SchemaRenderer
            key={subName}
            name={subName}
            schema={subSchema}
            value={value[subName]}
          />
        ))}
      </Container>
    );
  }
}
