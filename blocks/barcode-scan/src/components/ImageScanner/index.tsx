import Quagga, { type QuaggaJSResultCallbackFunction } from '@ericblade/quagga2';
import { type VNode } from 'preact';
import { useState } from 'preact/hooks';

interface ImageScannerProps {
  onDetected: QuaggaJSResultCallbackFunction;
}

export function ImageScanner({ onDetected }: ImageScannerProps): VNode {
  const [selectedImage, setSelectedImage] = useState(null);

  function runBarcodeDetection(image: any): void {
    Quagga.decodeSingle({
      inputStream: {
        type: 'ImageStream',
        size: 800,
        singleChannel: false,
      },
      locator: {
        patchSize: 'x-large',
        halfSample: true,
      },
      numOfWorkers: 4,
      decoder: {
        readers: ['code_128_reader'],
      },
      locate: true,
      src: image,
    });

    Quagga.onDetected(onDetected);
  }

  const handleFileChange = (event: any): void => {
    const [file] = event.target.files;
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
