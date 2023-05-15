import { bootstrap } from '@appsemble/preact';
import { type QuaggaJSResultObject } from '@ericblade/quagga2';
import { useEffect, useState } from 'preact/hooks';

import { CameraScanner } from './components/CameraScanner/index.js';
import { ImageScanner } from './components/ImageScanner/index.js';

bootstrap(({ events, parameters: { type }, ready }) => {
  useEffect(() => {
    ready();
  }, [ready]);

  const [barcode, setBarcode] = useState(null);

  const onDetected = (result: QuaggaJSResultObject): void => {
    setBarcode(result.codeResult.code);
    const obj = { barcode: result.codeResult.code };
    events.emit.foundBarcode(obj);
  };

  return (
    <div>
      <p>Barcode: {barcode}</p>
      {type === 'camera' ? (
        <CameraScanner onDetected={onDetected} />
      ) : type === 'file' ? (
        <ImageScanner onDetected={onDetected} />
      ) : (
        <div>No type?</div>
      )}
    </div>
  );
});
