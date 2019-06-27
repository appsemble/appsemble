import { BlockProps } from '@appsemble/react';
import { Loader } from '@appsemble/react-components';
import { Context, MapperFunction, compileFilters } from '@appsemble/utils/remap';
import React from 'react';
import { FormattedMessage, InjectedIntlProps } from 'react-intl';

import { BlockActions, BlockParameters, Remappers } from '../../../types';
import Card from '../Card';
import styles from './FeedBlock.css';
import messages from './messages';

function createRemapper(mapper: any, context: Context): MapperFunction {
  return mapper ? compileFilters(mapper, context) : () => null;
}

interface FeedBlockState {
  data: any[];
  loading: boolean;
}

/**
 * The top level component for the feed block.
 */
export default class FeedBlock extends React.Component<
  BlockProps<BlockParameters, BlockActions> & InjectedIntlProps,
  FeedBlockState
> {
  state: FeedBlockState = {
    data: [],
    loading: false,
  };

  remappers: Remappers;

  async componentDidMount(): Promise<void> {
    const { actions, block, events, intl } = this.props;
    const { parameters } = block;

    this.remappers = {
      title: createRemapper(parameters.title, { intl }),
      subtitle: createRemapper(parameters.subtitle, { intl }),
      heading: createRemapper(parameters.heading, { intl }),
      picture: createRemapper(parameters.picture, { intl }),
      description: createRemapper(parameters.description, { intl }),
      author: createRemapper(parameters.reply.author, { intl }),
      content: createRemapper(parameters.reply.content, { intl }),
      latitude: createRemapper(parameters.latitude, { intl }),
      longitude: createRemapper(parameters.longitude, { intl }),
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
      return (
        <div className={styles.empty}>
          <FormattedMessage {...messages.empty} />
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
