import Quagga, { type QuaggaJSResultCallbackFunction } from '@ericblade/quagga2';
import { type VNode } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

import styles from './index.module.css';

interface ImageScannerProps {
  config: any;
  onDetected: QuaggaJSResultCallbackFunction;
  setBarcode: any;
  resolution: number;
}

export function ImageScanner({
  config,
  onDetected,
  resolution,
  setBarcode,
}: ImageScannerProps): VNode {
  const [selectedImage, setSelectedImage] = useState<ArrayBuffer | string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function runBarcodeDetection(image: any): void {
    Quagga.decodeSingle(
      {
        src: image,
        inputStream: {
          type: 'ImageStream',
          size: resolution,
          singleChannel: false,
        },
        ...config,
      },
      onDetected,
    );
    Quagga.onProcessed(() => {
      setBarcode(null);
    });
  }

  useEffect(() => {
    const fileInput = inputRef.current;
    const file = fileInput?.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataURL = e.target?.result;
        setSelectedImage(dataURL ?? null);
        runBarcodeDetection(dataURL);
      };

      reader.readAsDataURL(file);
    }
  }, [config]);

  const handleFileChange = (event: any): void => {
    const file = event?.target?.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataURL = e?.target?.result;
      setSelectedImage(dataURL ?? null);
      runBarcodeDetection(dataURL);
    };

    reader.readAsDataURL(file);
  };

  const handleRemove = (): any => {
    if (inputRef) {
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      setBarcode(null);
      setSelectedImage(null);
    }
  };

  return (
    <div className={styles.imageScannerWrapper}>
      {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
      <label className={styles.fileLabel} for="fileInput">
        <i class="fas fa-barcode" />
        <input
          className={styles.hiddenInput}
          id="fileInput"
          onChange={handleFileChange}
          ref={inputRef}
          type="file"
        />
      </label>
      <br />

      {selectedImage ? (
        <div className={styles.imageContainer}>
          <img alt="Selected" src={selectedImage as string} />
          <button className={styles.close} onClick={handleRemove} type="button">
            <i class="fas fa-times" />
          </button>
        </div>
      ) : (
        <div>No Image found </div>
      )}
    </div>
  );
}
