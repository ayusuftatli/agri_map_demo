# Map Debug Utilities

This directory contains debugging tools for the map component.

## mapDebugUtils.js

Contains visualization tools for debugging soil data extraction from parcels.

### Features

The debug visualization shows:
- **Yellow dashed box**: Bounding box of the selected parcel
- **Red circles**: All generated sample points in the grid
- **Green circles**: Sample points that are inside the parcel boundary

This helps visualize how the soil data extraction algorithm works by showing which points are being sampled.

### How to Enable

1. Open `src/components/Map.jsx`
2. Uncomment the import at the top:
   ```javascript
   import { visualizeDebugPoints } from '../utils/mapDebugUtils';
   ```
3. Uncomment the bbox calculation (around line 132):
   ```javascript
   const bbox = getBoundingBox(geometry);
   ```
4. Uncomment the visualization call (around line 141):
   ```javascript
   visualizeDebugPoints(map.current, samplePoints, pointsInsideParcel, bbox);
   ```

### How to Disable

Simply comment out the three lines mentioned above to disable the visualization.

### Functions

#### `visualizeDebugPoints(map, allPoints, insidePoints, bbox)`
Adds debug visualization layers to the map.

**Parameters:**
- `map` - The Mapbox map instance
- `allPoints` - Array of all generated sample points `[[lng, lat], ...]`
- `insidePoints` - Array of points inside the parcel `[[lng, lat], ...]`
- `bbox` - Bounding box `[[minLng, minLat], [maxLng, maxLat]]`

#### `removeDebugVisualization(map)`
Removes all debug visualization layers from the map.

**Parameters:**
- `map` - The Mapbox map instance