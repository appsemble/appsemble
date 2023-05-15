import { bootstrap } from '@appsemble/preact';
import { useEffect } from 'preact/hooks';

import { CameraScanner } from './components/CameraScanner/index.js';

bootstrap(({ parameters: { type }, ready }) => {
  useEffect(() => {
    ready();
  }, [ready]);

  return <div>{type === 'camera' ? <CameraScanner /> : <div>No type?</div>}</div>;
});
