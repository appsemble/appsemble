import Quagga, {
  type QuaggaJSResultCallbackFunction,
  type QuaggaJSResultObject,
} from '@ericblade/quagga2';
import { type VNode } from 'preact';
import { useRef } from 'preact/hooks';

interface CameraScannerProps {
  config: any;
  onDetected: QuaggaJSResultCallbackFunction;
}
export function CameraScanner({ config, onDetected }: CameraScannerProps): VNode {
  const videoRef = useRef<HTMLVideoElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);

  const onProcessedCanvas = (result: QuaggaJSResultObject): void => {
    const drawingCtx = drawingCanvasRef.current.getContext('2d');

    drawingCanvasRef.current.width = videoRef.current.width;
    drawingCanvasRef.current.height = videoRef.current.height;

    if (result) {
      if (result.boxes) {
        drawingCtx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
        result.boxes.filter((box) => box !== result.box);
        for (const box of result.boxes) {
          Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, {
            color: 'green',
            lineWidth: 2,
          });
        }
      }

      if (result.box) {
        Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, {
          color: '#00F',
          lineWidth: 2,
        });
      }

      if (result.codeResult?.code) {
        Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, {
          color: 'red',
          lineWidth: 3,
        });
      }
    }
  };

  function videoStart(): void {
    // @ts-expect-error Quagga types are wrong
    Quagga.init(
      {
        inputStream: {
          type: 'LiveStream',
          target: videoRef.current,
          willReadFrequently: true,
          size: 800,
          constraints: {
            width: 640,
            height: 320,
            facingMode: 'environment',
          },
        },
        frequency: 10,
        ...config,
      },
      (err: any): void => {
        if (err) {
          return;
        }
        Quagga.start();
      },
    );
    Quagga.onProcessed(onProcessedCanvas);
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
      <canvas ref={drawingCanvasRef} />
    </div>
  );
}
