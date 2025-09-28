export { useARSupport, requestCameraPermission } from './useARSupport';
export type { ARSupportInfo } from './useARSupport';

export {
  addAutoRefreshingRasterPlane,
  addGeoMarker,
  addCutLine,
  latLngToWorld
} from './arLayers';
export type { AutoRefreshOptions, RefreshHandle } from './arLayers';

export { default as UniversalAR, getARScene } from './UniversalAR';
export type { AROverlay, UniversalARProps } from './UniversalAR';