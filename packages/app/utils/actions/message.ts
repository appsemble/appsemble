import { ActionCreator } from '.';

export const message: ActionCreator<'message'> = ({
  definition: { body, color = 'info', dismissable, timeout },
  remap,
  showMessage,
}) => [
  (data) => {
    showMessage({ body: remap(body, data), color, dismissable, timeout });
    return data;
  },
];
