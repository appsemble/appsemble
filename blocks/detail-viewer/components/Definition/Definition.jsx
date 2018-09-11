import {
  Content,
  Subtitle,
} from '@appsemble/react-bulma';
import PropTypes from 'prop-types';
import React from 'react';


/**
 * Render a description title and definition for a JSON schema definition.
 */
export default class Definition extends React.Component {
  static propTypes = {
    /**
     * The element to render to represent the value.
     */
    children: PropTypes.node,
    /**
     * The name to render.
     */
    name: PropTypes.string.isRequired,
    /**
     * The JSON schema for which to render the definition. If the schema has a title, this will take
     * precedence over the name.
     */
    schema: PropTypes.shape().isRequired,
  };

  static defaultProps = {
    children: null,
  };

  render() {
    const {
      children,
      name,
      schema,
    } = this.props;

    return (
      <Content>
        <Subtitle is={6}>
          {schema.title || name}
        </Subtitle>
        {children}
      </Content>
    );
  }
}
