import { bootstrap } from '@appsemble/sdk';
import jsQR from 'jsqr';
import { Point } from 'jsqr/dist/locator';

bootstrap(({ events, parameters: { drawQr = false, height = 0, width = 0 }, theme, utils }) => {
  const div = document.createElement('div');

  // Create elements
  const video = document.createElement('video');
  const canvasElement = document.createElement('canvas');
  const canvas = canvasElement.getContext('2d');

  /**
   * Draw a line on the canvas.
   *
   * @param begin  The position of the beginning of the line.
   * @param end  The position of the end of the line.
   * @param color  The color of the line as a hexadecimal color.
   */
  function drawLine(begin: Point, end: Point, color: string): void {
    canvas.beginPath();
    canvas.moveTo(begin.x, begin.y);
    canvas.lineTo(end.x, end.y);
    canvas.lineWidth = 4;
    canvas.strokeStyle = color;
    canvas.stroke();
  }

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
          drawLine(code.location.topLeftCorner, code.location.topRightCorner, theme.primaryColor);
          drawLine(
            code.location.topRightCorner,
            code.location.bottomRightCorner,
            theme.primaryColor,
          );
          drawLine(
            code.location.bottomRightCorner,
            code.location.bottomLeftCorner,
            theme.primaryColor,
          );
          drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, theme.primaryColor);
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
