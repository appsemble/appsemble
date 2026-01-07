import { type RequireAtLeastOne } from 'type-fest';

export interface GridLayoutDefinition {
  columns: number;
  template: string[];
}

export interface GridLayoutSpacingDefinition {
  unit: string;
  padding: number;
  gap: number;
}

export interface DeviceGridLayoutDefinition {
  layout: GridLayoutDefinition;
  spacing: GridLayoutSpacingDefinition;
}

export type PageLayoutDefinition = RequireAtLeastOne<{
  mobile: DeviceGridLayoutDefinition;
  tablet: DeviceGridLayoutDefinition;
  desktop: DeviceGridLayoutDefinition;
}>;
