import Quagga, { type QuaggaJSResultCallbackFunction } from '@ericblade/quagga2';
import { type VNode } from 'preact';
import { useRef } from 'preact/hooks';

interface CameraScannerProps {
  onDetected: QuaggaJSResultCallbackFunction;
}
export function CameraScanner({ onDetected }: CameraScannerProps): VNode {
  const videoRef = useRef<HTMLVideoElement>(null);

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

  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then((stream) => {
    videoRef.current.srcObject = stream;

    videoRef.current.setAttribute('playsinline', 'true');

    videoRef.current.play();

    if (videoRef.current) {
      videoStart();
    }
  });

  return (
    <div>
      <h1>Camera Scanner</h1>
      <video id="interactive" ref={videoRef}>
        <track class="viewport" kind="captions" label="English" src="captions.vtt" />
      </video>
    </div>
  );
}
