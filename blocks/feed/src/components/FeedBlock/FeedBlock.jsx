import { Loader } from '@appsemble/react-components';
import { compileFilters } from '@appsemble/utils/remap';
import React from 'react';
import PropTypes from 'prop-types';

import Card from '../Card';

function createRemapper(mapper) {
  return mapper ? compileFilters(mapper) : () => null;
}

/**
 * The top level component for the feed block.
 */
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
    /**
     * The Appsemble events object.
     */
    events: PropTypes.shape().isRequired,
  };

  state = {
    data: [],
  };

  async componentDidMount() {
    const { actions, block, events } = this.props;
    const { parameters } = block;

    this.remappers = {
      title: createRemapper(parameters.title),
      subtitle: createRemapper(parameters.subtitle),
      heading: createRemapper(parameters.heading),
      picture: createRemapper(parameters.picture),
      description: createRemapper(parameters.description),
    };

    if (parameters.listen) {
      events.on(parameters.listen, data => {
        this.setState({ data });
      });
    } else {
      const data = await actions.load.dispatch();
      this.setState({ data });
    }
  }

  onUpdate = resource => {
    const { data } = this.state;
    this.setState({ data: data.map(entry => (entry.id === resource.id ? resource : entry)) });
  };

  render() {
    const { data } = this.state;

    if (!data.length) {
      return <Loader />;
    }

    return data.map(content => (
      <Card
        key={content.id}
        content={content}
        onUpdate={this.onUpdate}
        remappers={this.remappers}
      />
    ));
  }
}
