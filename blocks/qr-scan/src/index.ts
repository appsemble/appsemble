import './index.css';

import { bootstrap } from '@appsemble/sdk';

bootstrap(() => {
  const video = document.createElement('video');
  const div = document.createElement('div');

  video.autoplay = true;
  window.onload = function capture() {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      video.srcObject = stream;
    });
  };

  div.append(video);
  return div;
});
