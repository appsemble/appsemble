import { type ActionCreator } from './index.js';
import { getHandlerFunction } from '../bootstrapper.js';

export const controller: ActionCreator<'controller'> = ({ definition }) => {
  const { handler } = definition;
  return [(data) => getHandlerFunction(handler)(data)];
};
