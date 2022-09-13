import { bootstrap } from '@appsemble/sdk';
import jsQR from 'jsqr';

bootstrap(({ events, parameters: { drawQr = false, height = 0, width = 0 }, theme, utils }) => {
  const div = document.createElement('div');

  // Create elements
  const video = document.createElement('video');
  const canvasElement = document.createElement('canvas');
  const canvas = canvasElement.getContext('2d');

  let stopped = false;
  utils.addCleanup(() => {
    stopped = true;
  });

  /**
   * Find and open qr code
   */
  function tick(): void {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvasElement.hidden = false;

      // Set height and width of canvas element
      canvasElement.height = height === 0 ? video.videoHeight : height;
      canvasElement.width = width === 0 ? video.videoWidth : width;

      canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
      const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);

      // Get URL from QR-Code
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      // If QR-Code is found
      if (code) {
        if (drawQr) {
          // Draw rectangle on canvas
          const square = code.location;
          canvas.beginPath();
          canvas.moveTo(square.topLeftCorner.x, square.topLeftCorner.y);
          canvas.lineTo(square.topRightCorner.x, square.topRightCorner.y);
          canvas.lineTo(square.bottomRightCorner.x, square.bottomRightCorner.y);
          canvas.lineTo(square.bottomLeftCorner.x, square.bottomLeftCorner.y);
          canvas.closePath();
          canvas.lineWidth = 4;
          canvas.strokeStyle = theme.primaryColor;
          canvas.stroke();
        }

        // Emit event with QR URL
        events.emit.foundQr(code.data);
      }
    }
    if (!stopped) {
      requestAnimationFrame(tick);
    }
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

  div.append(canvasElement);

  return div;
});
