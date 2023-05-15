import { useBlock } from '@appsemble/preact';
import Quagga, { type QuaggaJSResultObject } from '@ericblade/quagga2';
import { type VNode } from 'preact';
import { useRef, useState } from 'preact/hooks';

export function CameraScanner(): VNode {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [barcode, setBarcode] = useState('123');

  const { events, parameters } = useBlock();

  const onDetected = (result: QuaggaJSResultObject): void => {
    setBarcode(result.codeResult.code);
    events.emit.foundBarcode(result.codeResult.code);
  };

  function videoStart(): void {
    Quagga.init(
      {
        inputStream: {
          type: 'LiveStream',
          target: videoRef.current,
          willReadFrequently: true,
          constraints: {
            width: 640,
            height: 320,
            facingMode: 'environment',
          },
        },
        locator: {
          halfSample: true,
          patchSize: 'x-large',
        },
        frequency: 10,
        numOfWorkers: 0,
        decoder: {
          readers: ['code_128_reader'],
        },
        locate: true,
      },
      (err: any): void => {
        if (err) {
          return;
        }
        Quagga.start();
      },
    );
    Quagga.onDetected(onDetected);
  }

  if (parameters.type === 'camera') {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then((stream) => {
      videoRef.current.srcObject = stream;

      videoRef.current.setAttribute('playsinline', 'true');

      videoRef.current.play();

      if (videoRef.current) {
        videoStart();
      }
    });
  }

  return (
    <div>
      <h1>Camera Scanner</h1>
      <p>barcode: {barcode}</p>
      <video id="interactive" ref={videoRef}>
        <track class="viewport" kind="captions" label="English" src="captions.vtt" />
      </video>
    </div>
  );
}
