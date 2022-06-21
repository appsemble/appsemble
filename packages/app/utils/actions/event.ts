import { ActionCreator } from '.';

export const event: ActionCreator<'event'> = ({
  definition: { event: eventName, waitFor },
  ee,
}) => [
  (data) => {
    ee.emit(eventName, data);
    return waitFor
      ? new Promise((resolve, reject) => {
          ee.once(waitFor, (response, error) => (error ? reject(error) : resolve(response)));
        })
      : data;
  },
];
