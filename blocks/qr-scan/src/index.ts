import { bootstrap } from '@appsemble/sdk';
import './index.css';
import jsQR from 'jsqr';

bootstrap(({ events, parameters: { drawQr = false, videoHeight = 0, videoWidth = 0 } }) => {
  const div = document.createElement('div');

  const video = document.createElement('video');
  const canvasElement = document.createElement('canvas');
  const canvas = canvasElement.getContext('2d');

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

      canvasElement.height = videoHeight === 0 ? video.videoHeight : videoHeight;
      canvasElement.width = videoWidth === 0 ? video.videoWidth : videoWidth;
      canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
      const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });
      if (code) {
        if (drawQr) {
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
    // Commented -> video.setAttribute("playsinline", true);
    video.play();
    requestAnimationFrame(tick);
  });

  div.append(canvasElement);
  return div;
});
