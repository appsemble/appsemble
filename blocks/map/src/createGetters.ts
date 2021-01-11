import { Parameters } from '@appsemble/sdk';

export interface LatLngMapper {
  lat: (data: any) => any;
  lng: (data: any) => any;
}

export function createGetters(params: Parameters): LatLngMapper {
  return {
    lat: params.latitude == null ? (data) => data.latitude : () => params.latitude,
    lng: params.longitude == null ? (data) => data.longitude : () => params.longitude,
  };
}
