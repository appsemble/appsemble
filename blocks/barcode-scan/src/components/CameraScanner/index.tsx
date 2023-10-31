import { useToggle } from '@appsemble/preact-components';
import Quagga, {
  type QuaggaJSResultCallbackFunction,
  type QuaggaJSResultObject,
} from '@ericblade/quagga2';
import { type VNode } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

import styles from './index.module.css';

interface CameraScannerProps {
  config: any;
  onDetected: QuaggaJSResultCallbackFunction;
  resolution: number;
  setBarcode: any;
}
export function CameraScanner({
  config,
  onDetected,
  resolution,
  setBarcode,
}: CameraScannerProps): VNode {
  const videoRef = useRef<HTMLVideoElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const scanning = useToggle();
  const [videoPlaying, setVideoPlaying] = useState(false);

  const onProcessedCanvas = (result: QuaggaJSResultObject): void => {
    const drawingCanvas = drawingCanvasRef.current;
    const video = videoRef.current;
    if (drawingCanvas && video) {
      const drawingCtx = drawingCanvas.getContext('2d')!;

      drawingCanvas.width = video.width;
      drawingCanvas.height = video.height;

      if (result) {
        if (result.boxes) {
          drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
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
    }
  };

  function videoStart(): void {
    Quagga.init(
      {
        inputStream: {
          type: 'LiveStream',
          target: videoRef.current,
          willReadFrequently: true,
          size: resolution,
          constraints: {
            width: 640,
            height: 320,
            facingMode: 'environment',
          },
        },
        frequency: 10,
        ...config,
      },
      (err) => {
        if (err) {
          return;
        }
        Quagga.start();
      },
    );
    Quagga.onProcessed(onProcessedCanvas);
    Quagga.onDetected(onDetected);
  }

  useEffect(() => {
    videoStart();
  }, [config]);

  const handleScanStart = (): void => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    scanning.enable();
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then((stream) => {
      video.srcObject = stream;

      video.setAttribute('playsinline', 'true');

      video.play();
      setVideoPlaying(true);

      if (videoRef.current) {
        videoStart();
      }
    });
  };

  const handleScanStop = (): void => {
    scanning.disable();
    setVideoPlaying(false);
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        const tracks = stream.getTracks();
        for (const track of tracks) {
          track.stop();
        }
        videoRef.current.srcObject = null;
      }
    }
    Quagga.stop();
    setBarcode(null);
  };

  return (
    <div className={styles.videoScannerWrapper}>
      {scanning.enabled ? null : (
        <button className={styles.start} onClick={handleScanStart} type="button">
          Scan
        </button>
      )}

      {scanning.enabled ? (
        <div className={styles.videoContainer}>
          <video id="interactive" ref={videoRef}>
            <track class="viewport" kind="captions" label="English" src="captions.vtt" />
          </video>
          <canvas ref={drawingCanvasRef} />
          {videoPlaying ? (
            <button className={styles.close} onClick={handleScanStop} type="button">
              <i class="fas fa-times" />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
