import { bootstrap } from '@appsemble/sdk';
import jsQR from 'jsqr';

bootstrap(({ events, parameters: { drawQr = false, height = 0, width = 0 } }) => {
  // Create div
  const div = document.createElement('div');

  // Create elements
  const video = document.createElement('video');
  const canvasElement = document.createElement('canvas');
  const canvas = canvasElement.getContext('2d');

  // Draw lines on the canvas
  function drawLine(begin: { x: any; y: any }, end: { x: any; y: any }, color: string): void {
    canvas.beginPath();
    canvas.moveTo(begin.x, begin.y);
    canvas.lineTo(end.x, end.y);
    canvas.lineWidth = 4;
    canvas.strokeStyle = color;
    canvas.stroke();
  }

  function tick(): void {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvasElement.hidden = false;

      // Set height and width of canvas element
      canvasElement.height = height === 0 ? video.videoHeight : height;
      canvasElement.width = width === 0 ? video.videoWidth : width;

      // Draw Image
      canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
      const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);

      // Get URL from QR-Code
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      // If QR-Code is found
      if (code) {
        // If `drawQr` is true
        if (drawQr) {
          // Draw rectangle on canvas
          drawLine(code.location.topLeftCorner, code.location.topRightCorner, '#FF3B58');
          drawLine(code.location.topRightCorner, code.location.bottomRightCorner, '#FF3B58');
          drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, '#FF3B58');
          drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, '#FF3B58');
        }

        // Emit event with QR URL (code.data)
        events.emit.foundQr(code.data);
      }
    }
    requestAnimationFrame(tick);
  }

  // Use facingMode: environment to attempt to get the front camera on phones
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then((stream) => {
    video.srcObject = stream;
    // Required to tell iOS safari we don't want fullscreen
    video.setAttribute('playsinline', 'true');

    // Play video stream
    video.play();
    requestAnimationFrame(tick);
  });

  // Append canvas element to the div
  div.append(canvasElement);

  // Return div
  return div;
});
