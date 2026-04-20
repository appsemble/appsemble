interface ResponseStatusError {
  response?: {
    status?: number;
  };
}

export const dataLoadErrorCodes = {
  forbidden: 'error.forbidden',
  generic: 'error.generic',
} as const;

export function getDataLoadError(error: unknown): string {
  if (error && typeof error === 'object') {
    const responseStatusError = error as ResponseStatusError;

    if (responseStatusError.response?.status === 403) {
      return dataLoadErrorCodes.forbidden;
    }
  }

  return dataLoadErrorCodes.generic;
}
