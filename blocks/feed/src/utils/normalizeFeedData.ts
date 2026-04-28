interface FeedErrorState {
  permissionDenied: boolean;
}

export const feedErrorCodes = {
  forbidden: 'error.forbidden',
} as const;

export function normalizeFeedData<Data>(receivedData: Data[] | null, error?: string): Data[] {
  if (error || !Array.isArray(receivedData)) {
    return [];
  }

  return receivedData;
}

export function getFeedErrorState(error?: string): FeedErrorState {
  return {
    permissionDenied: error === feedErrorCodes.forbidden,
  };
}
