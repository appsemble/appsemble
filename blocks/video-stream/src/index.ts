import './index.css';

import { bootstrap } from '@appsemble/sdk';

bootstrap(() => {
  const video = document.createElement('video');
  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        video.srcObject = stream;
      })
      .catch((err) => {
        String(err);
      });
  }
  video.autoplay = true;

  return video;
});
