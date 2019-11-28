/** @jsx h */
import { BlockProps, FormattedMessage } from '@appsemble/preact';
import { Loader } from '@appsemble/preact-components';
import { compileFilters, MapperFunction } from '@appsemble/utils';
import { Component, h, VNode } from 'preact';

import { BlockActions, BlockParameters, Remappers } from '../../../types';
import Card from '../Card';
import styles from './FeedBlock.css';

function createRemapper(mapper: any): MapperFunction {
  return mapper ? compileFilters(mapper) : () => null;
}

interface FeedBlockState {
  data: any[];
  loading: boolean;
}

/**
 * The top level component for the feed block.
 */
export default class FeedBlock extends Component<
  BlockProps<BlockParameters, BlockActions>,
  FeedBlockState
> {
  state: FeedBlockState = {
    data: [],
    loading: true,
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
      pictures: createRemapper(parameters.pictures),
      description: createRemapper(parameters.description),
      ...(parameters.reply && {
        author: createRemapper(parameters.reply.author),
        content: createRemapper(parameters.reply.content),
      }),
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
      const data = await actions.onLoad.dispatch();
      this.setState({
        data,
        loading: false,
      });
    }
  }

  onUpdate = (resource: any): void => {
    const { data } = this.state;
    this.setState({ data: data.map(entry => (entry.id === resource.id ? resource : entry)) });
  };

  render(): VNode | VNode[] {
    const { data, loading } = this.state;

    if (loading) {
      return <Loader />;
    }

    if (!data.length) {
      return (
        <div className={styles.empty}>
          <FormattedMessage id="empty" />
        </div>
      );
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
