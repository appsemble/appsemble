import { type ActionCreator } from './index.js';

export const share: ActionCreator<'share'> = ({ definition, remap, showShareDialog }) => [
  async (data) => {
    const title = definition?.title && remap(definition.title, data);
    const text = definition?.text && remap(definition.text, data);
    const url = definition?.url && remap(definition.url, data);

    await (navigator.share
      ? navigator.share({ title, text, url })
      : showShareDialog?.({ title, text, url }));

    return data;
  },
];
