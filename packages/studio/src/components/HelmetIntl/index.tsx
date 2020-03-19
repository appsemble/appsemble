import React from 'react';
import { Helmet } from 'react-helmet';
import { injectIntl, MessageDescriptor, WrappedComponentProps } from 'react-intl';

interface HelmIntlProps extends WrappedComponentProps {
  title: MessageDescriptor;
  titleValues?: { [key: string]: string };
}

function HelmetIntl({ intl, title, titleValues = {} }: HelmIntlProps): React.ReactElement {
  return <Helmet title={intl.formatMessage(title, titleValues)} />;
}

// XXX https://github.com/akameco/babel-plugin-react-intl-auto/issues/98
export default injectIntl(HelmetIntl);
