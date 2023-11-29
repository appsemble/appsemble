import { type ActionCreator } from './index.js';
import { getHandlerFunction } from '../bootstrapper.js';

export const controller: ActionCreator<'controller'> = ({ definition }) => {
  const { handler } = definition;

  const handlerFunctionPromise = getHandlerFunction(handler);

  return [
    async (data) => {
      const handlerFunction = await handlerFunctionPromise;
      return handlerFunction(data);
    },
  ];
};
