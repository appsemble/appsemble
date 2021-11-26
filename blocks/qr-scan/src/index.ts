import './index.css';

import { bootstrap } from '@appsemble/sdk';

bootstrap(() => {
  const div = document.createElement('div');
  const video = document.createElement('video');

  navigator.mediaDevices.getUserMedia().then((stream) => {
    video.srcObject = stream;
  });

  div.append(video);

  return div;
});
