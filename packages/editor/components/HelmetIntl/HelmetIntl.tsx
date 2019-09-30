import React from 'react';
import { Helmet } from 'react-helmet';
import { MessageDescriptor, WrappedComponentProps } from 'react-intl';

export interface HelmIntlProps extends WrappedComponentProps {
  title: MessageDescriptor;
  titleValues?: Record<string, string>;
}

export default class HelmetIntl extends React.Component<HelmIntlProps> {
  static defaultProps = {
    titleValues: {},
  };

  render(): JSX.Element {
    const { title, titleValues, intl } = this.props;

    return <Helmet title={intl.formatMessage(title, titleValues)} />;
  }
}
