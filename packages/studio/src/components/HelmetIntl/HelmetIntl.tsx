import React from 'react';
import { Helmet } from 'react-helmet';
import { MessageDescriptor, WrappedComponentProps } from 'react-intl';

interface HelmIntlProps extends WrappedComponentProps {
  title: MessageDescriptor;
  titleValues?: { [key: string]: string };
}

export default function HelmetIntl({
  intl,
  title,
  titleValues = {},
}: HelmIntlProps): React.ReactElement {
  return <Helmet title={intl.formatMessage(title, titleValues)} />;
}
