import React, { ReactElement } from 'react';
import { Helmet } from 'react-helmet';
import { MessageDescriptor, useIntl } from 'react-intl';

interface HelmIntlProps {
  title: MessageDescriptor;
  titleValues?: { [key: string]: string };
}

export function HelmetIntl({ title, titleValues = {} }: HelmIntlProps): ReactElement {
  const { formatMessage } = useIntl();
  return <Helmet title={formatMessage(title, titleValues)} />;
}
