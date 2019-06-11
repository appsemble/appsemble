import { BlockProps } from '@appsemble/react';
import { Loader } from '@appsemble/react-components';
import { MapperFunction, compileFilters } from '@appsemble/utils/remap';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import { BlockActions, BlockParameters, Remappers } from '../../../types';
import Card from '../Card';
import messages from './messages';

function createRemapper(mapper?: any): MapperFunction {
  return mapper ? compileFilters(mapper) : () => null;
}

interface FeedBlockState {
  data: any[];
  loading: boolean;
}

/**
 * The top level component for the feed block.
 */
export default class FeedBlock extends React.Component<
  BlockProps<BlockParameters, BlockActions>,
  FeedBlockState
> {
  state: FeedBlockState = {
    data: [],
    loading: false,
  };

  remappers: Remappers;

  async componentDidMount(): Promise<void> {
    const { actions, block, events } = this.props;
    const { parameters } = block;

    this.remappers = {
      title: createRemapper(parameters.title),
      subtitle: createRemapper(parameters.subtitle),
      heading: createRemapper(parameters.heading),
      picture: createRemapper(parameters.picture),
      description: createRemapper(parameters.description),
      author: createRemapper(parameters.reply.author),
      content: createRemapper(parameters.reply.content),
      latitude: createRemapper(parameters.latitude),
      longitude: createRemapper(parameters.longitude),
    };

    if (parameters.listen) {
      events.on(parameters.listen, (data: any) => {
        this.setState({
          data,
          loading: false,
        });
      });
    } else {
      const data = await actions.load.dispatch();
      this.setState({
        data,
        loading: false,
      });
    }
  }

  onUpdate = (resource: any) => {
    const { data } = this.state;
    this.setState({ data: data.map(entry => (entry.id === resource.id ? resource : entry)) });
  };

  render(): React.ReactNode {
    const { data, loading } = this.state;

    if (loading) {
      return <Loader />;
    }

    if (!data.length) {
      return <FormattedMessage {...messages.empty} />;
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
