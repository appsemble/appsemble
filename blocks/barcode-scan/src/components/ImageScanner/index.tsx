import Quagga, { type QuaggaJSResultCallbackFunction } from '@ericblade/quagga2';
import { type VNode } from 'preact';
import { useState } from 'preact/hooks';

interface ImageScannerProps {
  config: any;
  onDetected: QuaggaJSResultCallbackFunction;
  onProcessed: QuaggaJSResultCallbackFunction;
  resolution: number;
}

export function ImageScanner({
  config,
  onDetected,
  onProcessed,
  resolution,
}: ImageScannerProps): VNode {
  const [selectedImage, setSelectedImage] = useState(null);

  function runBarcodeDetection(image: any): void {
    Quagga.decodeSingle({
      src: image,
      inputStream: {
        type: 'ImageStream',
        size: resolution,
        singleChannel: false,
      },
      ...config,
    });

    Quagga.onProcessed(onProcessed);
    Quagga.onDetected(onDetected);
  }

  const handleFileChange = (event: any): void => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataURL = e.target.result;
      setSelectedImage(dataURL);
      runBarcodeDetection(dataURL);
    };

    reader.readAsDataURL(file);
  };
  return (
    <div>
      <h1>Barcode Scanner</h1>
      <input onChange={handleFileChange} type="file" />
      {selectedImage ? <img alt="Selected" src={selectedImage} /> : <div>No Image found </div>}
    </div>
  );
}
