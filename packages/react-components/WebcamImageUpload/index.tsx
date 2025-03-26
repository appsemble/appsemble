import {
  forwardRef,
  type ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useIntl } from 'react-intl';

import { messages } from './messages.js';
import { FormComponent } from '../FormComponent/index.js';
import { useMessages } from '../MessagesProvider/index.js';
import { useSimpleForm } from '../SimpleForm/index.js';

interface WebcamImageUploadProps {
  readonly videoButtonLabel?: ReactNode;
  readonly clickButtonLabel?: ReactNode;
  readonly onCapture: (image: Blob) => void;
  readonly preview?: ReactNode;
  readonly formComponentClassName?: string;
  readonly help?: ReactNode;
  readonly required?: boolean;
}

export const WebcamImageUpload = forwardRef<HTMLVideoElement, WebcamImageUploadProps>(
  (
    {
      clickButtonLabel,
      formComponentClassName,
      help,
      onCapture,
      preview = null,
      required,
      videoButtonLabel,
    },
    ref,
  ) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const push = useMessages();
    const { formatMessage } = useIntl();
    const clickButtonRef = useRef<HTMLButtonElement | null>(null);
    const { pristine } = useSimpleForm();
    const [showVideo, setShowVideo] = useState<boolean>(false);

    useImperativeHandle(ref, () => videoRef.current!);

    useEffect(() => {
      if (!clickButtonRef.current) {
        return;
      }
      clickButtonRef.current.disabled = true;
    }, [clickButtonRef]);
    const startWebcam = useCallback(async () => {
      try {
        setShowVideo(true);
        clickButtonRef.current!.disabled = false;
        const mediaStream = await navigator.mediaDevices.getUserMedia?.({ video: true });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch {
        push({
          body: formatMessage(messages.error),
          color: 'danger',
        });
      }
    }, [push, formatMessage, videoRef, setShowVideo]);

    const stopWebcam = useCallback(() => {
      if (stream) {
        const tracks = stream.getTracks();
        for (const track of tracks) {
          track.stop();
        }
        setStream(null);
        pristine.picture = false;
        clickButtonRef.current!.disabled = true;
      }
    }, [stream, pristine]);

    const handleCapture = useCallback(() => {
      if (videoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
          context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          stopWebcam();
          canvas.toBlob((blob) => {
            onCapture(blob);
          }, 'image/png');
        }
      }
    }, [onCapture, stopWebcam, videoRef]);

    return (
      <FormComponent required={required}>
        <div className={formComponentClassName}>
          {preview}
          {showVideo ? (
            /* eslint-disable-next-line jsx-a11y/media-has-caption */
            <video autoPlay className="video" playsInline ref={videoRef} />
          ) : null}
          <div>
            <button className="button mr-1" onClick={startWebcam} type="button">
              {videoButtonLabel}
            </button>
            <button className="button" onClick={handleCapture} ref={clickButtonRef} type="button">
              {clickButtonLabel || 'Click'}
            </button>
          </div>
          {help ? <p className="help">{help}</p> : null}
        </div>
      </FormComponent>
    );
  },
);
