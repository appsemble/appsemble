import React from 'react';
import { Helmet } from 'react-helmet';
import { MessageDescriptor, useIntl } from 'react-intl';

interface HelmIntlProps {
  title: MessageDescriptor;
  titleValues?: { [key: string]: string };
}

export default function HelmetIntl({ title, titleValues = {} }: HelmIntlProps): React.ReactElement {
  const { formatMessage } = useIntl();
  return <Helmet title={formatMessage(title, titleValues)} />;
}
