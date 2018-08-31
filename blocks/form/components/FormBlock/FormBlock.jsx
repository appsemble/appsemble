import PropTypes from 'prop-types';
import React from 'react';
import {
  SchemaProvider,
} from 'react-schema-renderer';

import ArrayInput from '../ArrayInput';
import BooleanInput from '../BooleanInput';
import Form from '../Form';
import EnumInput from '../EnumInput';
import ObjectInput from '../ObjectInput';
import NumberInput from '../NumberInput';
import StringInput from '../StringInput';


const schemaOptions = {
  populate: 'onChange',
  renderers: {
    array: ArrayInput,
    boolean: BooleanInput,
    enum: EnumInput,
    integer: NumberInput,
    object: ObjectInput,
    number: NumberInput,
    string: StringInput,
  },
};


/**
 * The main component for the Appsemble form block.
 */
export default class FormBlock extends React.Component {
  static propTypes = {
    /**
     * The actions as passed by the Appsemble interface.
     */
    actions: PropTypes.shape().isRequired,
    /**
     * The block as passed by the Appsemble interface.
     */
    block: PropTypes.shape().isRequired,
  };

  render() {
    const {
      actions,
      block,
    } = this.props;

    return (
      <SchemaProvider value={schemaOptions}>
        <Form
          schema={block.parameters.schema}
          onSubmit={(event, value) => { actions.submit.dispatch(value); }}
        />
      </SchemaProvider>
    );
  }
}
