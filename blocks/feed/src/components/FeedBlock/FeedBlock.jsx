import { Loader } from '@appsemble/react-components';
import { compileFilters } from '@appsemble/utils/remap';
import React from 'react';
import PropTypes from 'prop-types';

import Card from '../Card';

function getNull() {
  return null;
}

export default class FeedBlock extends React.Component {
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

  state = { data: [] };

  async componentDidMount() {
    const { actions, block } = this.props;

    const { parameters } = block;
    this.remappers = {
      title: parameters.title ? compileFilters(parameters.title) : getNull,
      subtitle: parameters.subtitle ? compileFilters(parameters.subtitle) : getNull,
      heading: parameters.heading ? compileFilters(parameters.heading) : getNull,
      picture: parameters.description ? compileFilters(parameters.picture) : getNull,
      description: parameters.description ? compileFilters(parameters.description) : getNull,
    };

    const data = await actions.load.dispatch();

    this.setState({ data });
  }

  render() {
    const { block } = this.props;
    const { data } = this.state;

    if (!data.length) {
      return <Loader />;
    }

    return data.map(content => (
      <Card key={content.id} block={block} content={content} remappers={this.remappers} />
    ));
  }
}
