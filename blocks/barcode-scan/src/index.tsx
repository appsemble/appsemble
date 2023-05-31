import { bootstrap } from '@appsemble/preact';
import { type QuaggaJSResultObject } from '@ericblade/quagga2';
import { useEffect, useState } from 'preact/hooks';

import { CameraScanner } from './components/CameraScanner/index.js';
import { ImageScanner } from './components/ImageScanner/index.js';
import { MultipleOptions } from './components/MultipleOptions/index.js';

bootstrap(({ events, parameters: { barcodeType, type }, ready }) => {
  useEffect(() => {
    ready();
  }, [ready]);

  const codeTypeList = [
    'code_128',
    'ean',
    'ean_5',
    'ean_2',
    'ean_8',
    'code_39',
    'code_39_vin',
    'codabar',
    'upc',
    'upc_e',
    'i2of5',
    '2of5',
    'code_93',
    'code_32',
    'multiple',
  ];

  const [barcode, setBarcode] = useState(null);
  const [codeType, setCodeType] = useState(
    barcodeType && barcodeType !== 'multiple' ? barcodeType : 'code_128',
  );

  const onDetected = (result: QuaggaJSResultObject): void => {
    const foundCode = result.codeResult.code;
    setBarcode(foundCode);
    const obj = { barcode: foundCode };
    events.emit.foundBarcode(obj);
  };

  const onProcesseed = (): void => {
    setBarcode(null);
  };

  const config = {
    locator: {
      patchSize: 'x-large',
      halfSample: true,
    },
    numOfWorkers: 4,
    decoder: {
      readers: [`${codeType}_reader`],
    },
    locate: true,
  };

  const handleBarcodeTypeChange = (event: any): void => {
    const selectedValue = event.target.value;
    setCodeType(selectedValue);
  };

  return (
    <div>
      <p>Barcode: {barcode}</p>
      {barcodeType === 'multiple' ? (
        <MultipleOptions array={codeTypeList} onChange={handleBarcodeTypeChange} value={codeType} />
      ) : null}

      {type === 'camera' ? (
        <CameraScanner config={config} onDetected={onDetected} />
      ) : type === 'file' ? (
        <ImageScanner config={config} onDetected={onDetected} onProcessed={onProcesseed} />
      ) : (
        <div>No type?</div>
      )}
    </div>
  );
});
