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

export interface GridBreakpointsDefinition {
  tablet?: number;
  desktop?: number;
}

export interface DeviceGridLayoutDefinition {
  layout?: GridLayoutDefinition;
  spacing?: GridLayoutSpacingDefinition;
}

export interface ResponsiveGridLayoutDefinition {
  desktop?: DeviceGridLayoutDefinition;
  mobile?: DeviceGridLayoutDefinition;
  tablet?: DeviceGridLayoutDefinition;
}

export interface NavbarDeviceGridLayoutDefinition extends DeviceGridLayoutDefinition {
  layout: GridLayoutDefinition;
}

export interface ResponsiveNavbarGridLayoutDefinition {
  desktop?: NavbarDeviceGridLayoutDefinition;
  mobile?: NavbarDeviceGridLayoutDefinition;
  tablet?: NavbarDeviceGridLayoutDefinition;
}

export type NavbarLayoutDefinition = RequireAtLeastOne<ResponsiveNavbarGridLayoutDefinition>;

export type PageLayoutDefinition = RequireAtLeastOne<ResponsiveGridLayoutDefinition>;
