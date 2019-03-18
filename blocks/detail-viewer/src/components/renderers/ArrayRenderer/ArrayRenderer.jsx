import { Container } from '@appsemble/react-bulma';
import PropTypes from 'prop-types';
import React from 'react';
import { remapData } from '@appsemble/utils/remap';

import FileRenderer from '../FileRenderer';
import GeoCoordinatesRenderer from '../GeoCoordinatesRenderer';
import StringRenderer from '../StringRenderer';
import styles from './ArrayRenderer.css';

const renderers = {
  file: FileRenderer,
  geocoordinates: GeoCoordinatesRenderer,
  string: StringRenderer,
};

/**
 * A renderer for rendering lists of data.
 */
export default class ArrayRenderer extends React.Component {
  static propTypes = {
    /**
     * The parameters passed in by the Appsemble block.
     */
    block: PropTypes.shape().isRequired,
    /**
     * The data structure to read from.
     */
    data: PropTypes.shape().isRequired,
    /**
     * Structure used to define this field.
     */
    field: PropTypes.shape().isRequired,
    /**
     * The current value.
     */
    // eslint-disable-next-line react/forbid-prop-types
    value: PropTypes.array,
  };

  static defaultProps = {
    value: [],
  };

  render() {
    const { field, value, block, data } = this.props;
    const Component = renderers[field.arrayType] || renderers.string;

    return (
      <Container className={styles.root}>
        {(value || []).map((v, index) => {
          return (
            <Component
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              block={block}
              data={data}
              field={field}
              value={field.arrayName ? remapData(field.arrayName, v) : v}
            />
          );
        })}
      </Container>
    );
  }
}
