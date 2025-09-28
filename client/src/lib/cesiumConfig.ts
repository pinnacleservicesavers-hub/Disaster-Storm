import * as Cesium from 'cesium';

// Declare CESIUM_BASE_URL on window object for TypeScript
declare global {
  interface Window {
    CESIUM_BASE_URL: string;
  }
}

// Configure Cesium to load assets from the public folder
window.CESIUM_BASE_URL = '/cesium/';

// You can set your Cesium Ion access token here if you have one
// Cesium.Ion.defaultAccessToken = 'your_access_token_here';

export default Cesium;