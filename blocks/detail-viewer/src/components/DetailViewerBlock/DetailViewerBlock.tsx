import { BlockProps } from '@appsemble/react';
import { Loader } from '@appsemble/react-components';
import { remapData } from '@appsemble/utils';
import React from 'react';

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
export default class DetailViewerBlock extends React.Component<
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

  render(): JSX.Element {
    const { block, theme } = this.props;
    const { data } = this.state;

    if (data === undefined) {
      return <Loader />;
    }

    return (
      <div className={styles.root}>
        {block.parameters.fields.map((field, index) => {
          // Always default to string if type is not supported in renderers list.
          const Component = renderers[field.type] || renderers.string;

          return (
            <Component
              key={field.name || field.label || `${field.type}.${index}`}
              block={block}
              data={data}
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
