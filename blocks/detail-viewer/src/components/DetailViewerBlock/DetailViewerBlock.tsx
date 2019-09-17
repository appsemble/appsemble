/** @jsx h */
import { BlockProps } from '@appsemble/preact';
import { Loader } from '@appsemble/preact-components';
import { remapData } from '@appsemble/utils';
import { Component, h, VNode } from 'preact';

import { Actions, Parameters } from '../../../block';
import FileRenderer from '../renderers/FileRenderer';
import GeoCoordinatesRenderer from '../renderers/GeoCoordinatesRenderer';
import StringRenderer from '../renderers/StringRenderer';
import styles from './DetailViewerBlock.css';

interface DetailViewerBlockState {
  data: any;
}

const renderers = {
  file: FileRenderer,
  geocoordinates: GeoCoordinatesRenderer,
  string: StringRenderer,
};

/**
 * The main component for the Appsemble detail-viewer block.
 */
export default class DetailViewerBlock extends Component<
  BlockProps<Parameters, Actions>,
  DetailViewerBlockState
> {
  state: DetailViewerBlockState = {
    data: undefined,
  };

  async componentDidMount(): Promise<void> {
    const { actions, pageParameters } = this.props;

    const data = await actions.onLoad.dispatch(pageParameters);
    this.setState({ data });
  }

  render(): VNode {
    const { block, theme } = this.props;
    const { data } = this.state;

    if (data === undefined) {
      return <Loader />;
    }

    return (
      <div className={styles.root}>
        {block.parameters.fields.map((field, index) => {
          // Always default to string if type is not supported in renderers list.
          const Comp = renderers[field.type] || renderers.string;

          return (
            <Comp
              key={field.name || field.label || `${field.type}.${index}`}
              block={block}
              data={data}
              // @ts-ignore
              field={field}
              theme={theme}
              value={field.name ? remapData(field.name, data) : null}
            />
          );
        })}
      </div>
    );
  }
}
