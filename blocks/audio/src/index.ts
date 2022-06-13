import { bootstrap } from '@appsemble/sdk';

bootstrap(({ events, parameters: { src }, utils }) => {
  let audio: HTMLAudioElement;

  events.on.onAudio((data) => {
    const remappedSrc = utils.remap(src, data) as string;
    audio = document.createElement('audio');
    try {
      audio.src = String(new URL(remappedSrc));
    } catch {
      audio.src = utils.asset(remappedSrc);
    }

    audio.play();
  });

  events.on.stop(() => {
    audio?.pause();
    audio = undefined;
  });
});
