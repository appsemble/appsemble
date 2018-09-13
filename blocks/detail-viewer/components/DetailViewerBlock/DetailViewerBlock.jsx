import PropTypes from 'prop-types';
import React from 'react';
import {
  SchemaProvider,
  SchemaRenderer,
} from 'react-schema-renderer';

import ArrayRenderer from '../ArrayRenderer';
import BooleanRenderer from '../BooleanRenderer';
import EnumRenderer from '../EnumRenderer';
import ObjectRenderer from '../ObjectRenderer';
import NumberRenderer from '../NumberRenderer';
import StringRenderer from '../StringRenderer';


const schemaOptions = {
  renderers: {
    array: ArrayRenderer,
    boolean: BooleanRenderer,
    enum: EnumRenderer,
    integer: NumberRenderer,
    object: ObjectRenderer,
    number: NumberRenderer,
    string: StringRenderer,
  },
};


/**
 * The main component for the Appsemble detail-viewer block.
 */
export default class DetailViewerBlock extends React.Component {
  static propTypes = {
    /**
     * The actions as passed by the Appsemble interface.
     */
    actions: PropTypes.shape().isRequired,
    /**
     * The url parameters as passed by the Appsemble interface.
     */
    pageParameters: PropTypes.shape().isRequired,
    /**
     * The block as passed by the Appsemble interface.
     */
    block: PropTypes.shape().isRequired,
  };

  state = {
    data: null,
  };

  async componentDidMount() {
    const {
      actions,
      pageParameters,
    } = this.props;

    const data = await actions.load.dispatch(pageParameters);
    this.setState({ data });
  }

  render() {
    const {
      block,
    } = this.props;
    const {
      data,
    } = this.state;

    if (data == null) {
      return 'Loading…';
    }

    return (
      <SchemaProvider value={schemaOptions}>
        <SchemaRenderer
          schema={block.parameters.schema}
          value={data}
        />
      </SchemaProvider>
    );
  }
}
