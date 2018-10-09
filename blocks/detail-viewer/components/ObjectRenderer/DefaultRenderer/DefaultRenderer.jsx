import { Container, Title } from '@appsemble/react-bulma';
import PropTypes from 'prop-types';
import React from 'react';
import { SchemaRenderer } from 'react-schema-renderer';

/**
 * Render a JSON schema object as a definition list.
 */
export default class DefaultRenderer extends React.Component {
  static propTypes = {
    block: PropTypes.shape().isRequired,
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
    const { block, name, schema, value } = this.props;

    const { fields } = block.parameters;

    return (
      <Container>
        {Object.entries(schema.properties)
          .map(([subName, subSchema]) => {
            const propName = name == null ? subName : `${name}.${subName}`;
            return (
              fields.includes(propName) && [
                propName,
                <Container key={subName} className={propName.replace(/\./g, '-')}>
                  <Title size={6}>{subSchema.title || subName}</Title>
                  <SchemaRenderer name={subName} schema={subSchema} value={value[subName]} />
                </Container>,
              ]
            );
          })
          .filter(Boolean)
          .sort(([a], [b]) => fields.indexOf(a) - fields.indexOf(b))
          .map(([, node]) => node)}
      </Container>
    );
  }
}
