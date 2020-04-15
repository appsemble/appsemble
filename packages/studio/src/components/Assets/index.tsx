import axios from 'axios';
import React from 'react';
import { useIntl } from 'react-intl';

import { useApp } from '../AppContext';

interface Asset {
  id: string;
  mime: string;
  filename: string;
}

export default function Assets(): React.ReactElement {
  const { app } = useApp();
  const intl = useIntl();

  const [assets, setAssets] = React.useState<Asset[]>([]);

  React.useEffect(() => {
    axios.get<Asset[]>(`/api/apps/${app.id}/assets`).then((result) => setAssets(result.data));
  }, [app]);

  return <div>I am assets. I have {assets.length} assets.</div>;
}
