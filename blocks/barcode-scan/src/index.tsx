import { bootstrap } from '@appsemble/preact';
import { type QuaggaJSResultObject } from '@ericblade/quagga2';
import { useEffect, useState } from 'preact/hooks';

import { CameraScanner } from './components/CameraScanner/index.js';
import { ImageScanner } from './components/ImageScanner/index.js';
import { MultipleOptions } from './components/MultipleOptions/index.js';

bootstrap(
  ({
    events,
    parameters: { barcodeType = 'code_128', patchSize = 'x-large', resolution = 800, type },
    ready,
  }) => {
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
      'upc',
      'upc_e',
      'i2of5',
      '2of5',
      'code_93',
      'code_32',
      'multiple',
    ];
    const patchSizeList = ['x-small', 'small', 'medium', 'large', 'x-large'];

    const [barcode, setBarcode] = useState(null);
    const [codeType, setCodeType] = useState(barcodeType === 'multiple' ? 'code_128' : barcodeType);
    const [pSize, setPSize] = useState(patchSize === 'multiple' ? 'x-large' : patchSize);

    const onDetected = (result: QuaggaJSResultObject): void => {
      const foundCode = result.codeResult.code;
      setBarcode(foundCode);
      events.emit.foundBarcode({ barcode: foundCode });
    };

    const onProcesseed = (): void => {
      setBarcode(null);
    };

    const config = {
      locator: {
        patchSize: pSize,
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

    const handlePatchSizeChange = (event: any): void => {
      const selectedValue = event.target.value;
      setPSize(selectedValue);
    };

    return (
      <div>
        <p>Barcode: {barcode}</p>
        {barcodeType === 'multiple' ? (
          <MultipleOptions
            array={codeTypeList}
            onChange={handleBarcodeTypeChange}
            value={codeType}
          />
        ) : null}

        {patchSize === 'multiple' ? (
          <MultipleOptions array={patchSizeList} onChange={handlePatchSizeChange} value={pSize} />
        ) : null}

        {type === 'camera' ? (
          <CameraScanner config={config} onDetected={onDetected} resolution={resolution} />
        ) : (
          <ImageScanner
            config={config}
            onDetected={onDetected}
            onProcessed={onProcesseed}
            resolution={resolution}
          />
        )}
      </div>
    );
  },
);
