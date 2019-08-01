import React from 'react';
import Helmet from 'react-helmet';
import { FormattedMessage, InjectedIntlProps } from 'react-intl';

export interface HelmIntlProps {
  title: FormattedMessage.MessageDescriptor;
  titleValues?: Record<string, string>;
}

export default class HelmetIntl extends React.Component<HelmIntlProps & InjectedIntlProps> {
  static defaultProps = {
    titleValues: {},
  };

  render(): JSX.Element {
    const { title, titleValues, intl } = this.props;

    return <Helmet title={intl.formatMessage(title, titleValues)} />;
  }
}
