import { ActionCreator } from '.';

export const share: ActionCreator<'share'> = ({ definition, remap }) => [
  async (data) => {
    const title = definition?.title && remap(definition.title, data);
    const text = definition?.text && remap(definition.text, data);
    const url = definition?.url && remap(definition.url, data);

    if (navigator.share) {
      await navigator.share({ title, text, url });
    }

    return data;
  },
];
