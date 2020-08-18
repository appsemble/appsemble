import type { Parameters } from '@appsemble/sdk';
import { compileFilters } from '@appsemble/utils';

export interface LatLngMapper {
  lat: (data: any) => any;
  lng: (data: any) => any;
}

export function createGetters(params: Parameters): LatLngMapper {
  return {
    lat:
      params.latitude == null
        ? (data) => data.latitude
        : compileFilters(params.latitude, { intl: null }),
    lng:
      params.longitude == null
        ? (data) => data.longitude
        : compileFilters(params.longitude, { intl: null }),
  };
}
