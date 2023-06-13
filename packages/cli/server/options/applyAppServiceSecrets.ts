import { type ApplyAppServiceSecretsParams } from '@appsemble/node-utils';
import { type RawAxiosRequestConfig } from 'axios';

export const applyAppServiceSecrets = ({
  axiosConfig,
}: ApplyAppServiceSecretsParams): Promise<RawAxiosRequestConfig> => Promise.resolve(axiosConfig);
