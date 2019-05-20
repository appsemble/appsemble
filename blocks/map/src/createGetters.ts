import { compileFilters } from '@appsemble/utils/remap';

export interface LatLngMapper {
  lat: (data: any) => any;
  lng: (data: any) => any;
}

export interface BlockParameters {
  latitude: string;
  longitude: string;
}

export interface BlockActions {
  load: {};
  markerClick: {};
}

export default function createGetters(params: BlockParameters): LatLngMapper {
  return {
    lat: params.latitude == null ? data => data.latitude : compileFilters(params.latitude),
    lng: params.longitude == null ? data => data.longitude : compileFilters(params.longitude),
  };
}
