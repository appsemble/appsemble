import PropTypes from 'prop-types';
import React from 'react';

import EmailRenderer from './EmailRenderer';
import FileRenderer from './FileRenderer';
import TextRenderer from './TextRenderer';


/**
 * Render a property for a JSON schema definition whose type is `string`.
 *
 * String schemas may have a `format` property. These formats are defined by
 * http://json-schema.org/latest/json-schema-validation.html#rfc.section.7.3. The following formats
 * have specific handlers:
 *
 * - email
 * - idn-email
 *
 * The following formats have been considered and fall back to a regular string input:
 *
 * - date-time
 * - date
 * - time
 * - hostname
 * - idn-hostname
 * - ipv4
 * - ipv6
 * - uri
 * - uri-reference
 * - iri
 * - iri-reference
 * - uri-remplate
 * - json-pointer
 * - relative-json-pointer
 * - regex
 */
export default class StringRenderer extends React.Component {
  static propTypes = {
    /**
     * The enum schema definition for which to render an input.
     */
    schema: PropTypes.shape().isRequired,
    /**
     * The value to render
     */
    value: PropTypes.oneOfType([
      PropTypes.instanceOf(Blob),
      PropTypes.string,
    ]),
  };

  static defaultProps = {
    value: '',
  };

  render() {
    const {
      schema,
    } = this.props;

    switch (schema.format) {
      case 'email':
      case 'idn-email':
        return <EmailRenderer {...this.props} />;
      default:
        if (schema.appsembleFile) {
          return <FileRenderer {...this.props} />;
        }
        return <TextRenderer {...this.props} />;
    }
  }
}
