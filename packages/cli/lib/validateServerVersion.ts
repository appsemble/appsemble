import { logger, version } from '@appsemble/node-utils';
import axios from 'axios';

let warned = false;

interface VersionResponse {
  headers: Record<string, unknown>;
}

interface VersionClient {
  get: (url: string, options: { timeout: number }) => Promise<VersionResponse>;
  head: (url: string, options: { timeout: number }) => Promise<VersionResponse>;
}

async function requestServerVersion(client: VersionClient): Promise<VersionResponse> {
  const options = { timeout: 5000 };

  try {
    return await client.head('/api', options);
  } catch (error) {
    if (
      !axios.isAxiosError(error) ||
      (error.response?.status !== 404 && error.response?.status !== 405)
    ) {
      throw error;
    }
    return client.get('/api', options);
  }
}

export async function validateServerVersion(client: VersionClient = axios): Promise<void> {
  try {
    const response = await requestServerVersion(client);
    const serverVersion = response.headers['x-appsemble-version'];

    if (!warned && serverVersion && serverVersion !== version) {
      warned = true;
      logger.warn(
        `The Appsemble server version (${serverVersion}) does not match the CLI version (${version}).`,
      );
    }
  } catch (error) {
    logger.verbose(error);
  }
}
