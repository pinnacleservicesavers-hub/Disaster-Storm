# Mapbox Integration Setup

## Required Environment Variable

To use the enhanced Mapbox map styles, you need to set up your Mapbox access token:

1. **Get a Mapbox Token:**
   - Sign up at [mapbox.com](https://mapbox.com)
   - Go to your account dashboard
   - Create a new access token or copy your default public token

2. **Set the Environment Variable:**
   - Add the following to your environment:
   ```
   VITE_MAPBOX_TOKEN=pk.your_mapbox_token_here
   ```

## Available Map Styles

With the token configured, the following Mapbox styles are available:
- **Streets** (`streets-v11`) - Clean, modern street map
- **Satellite** (`satellite-v9`) - High-resolution satellite imagery
- **Terrain** (`terrain-v11`) - Topographic terrain view
- **Dark** (`dark-v10`) - Dark theme for night mode
- **Light** (`light-v10`) - Clean light theme

## Fallback Behavior

If no Mapbox token is provided, the application will:
- Display a warning message in the UI
- Automatically fall back to free tile sources (OpenStreetMap, ESRI, etc.)
- Continue to function with reduced style quality

## Enhanced Features

- **Soil Moisture Layer**: Now uses proper NOAA/CPC WMS services
- **Error Handling**: Graceful fallbacks for API failures
- **TypeScript**: Properly typed Leaflet integration
- **Performance**: Optimized tile loading with proper zoom levels