import { bootstrap } from '@appsemble/sdk';

bootstrap(({ events, parameters: { src }, utils }) => {
  const audio = document.createElement('audio');

  events.on.onAudio((data) => {
    const remappedSrc = utils.remap(src, data) as string;

    try {
      audio.src = String(new URL(remappedSrc));
    } catch {
      audio.src = utils.asset(remappedSrc);
    }

    audio.play();
  });

  events.on.stop(() => {
    audio.pause();
  });
});
