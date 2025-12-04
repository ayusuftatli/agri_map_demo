export const visualizeDebugPoints = (map, allPoints, insidePoints, bbox) => {
    if (!map) return;

    const allPointsGeoJSON = {
        type: 'FeatureCollection',
        features: allPoints.map(point => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: point },
            properties: { inside: false }
        }))
    };

    const insidePointsGeoJSON = {
        type: 'FeatureCollection',
        features: insidePoints.map(point => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: point },
            properties: { inside: true }
        }))
    };

    const bboxGeoJSON = {
        type: 'FeatureCollection',
        features: [{
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [bbox[0][0], bbox[0][1]],
                    [bbox[1][0], bbox[0][1]],
                    [bbox[1][0], bbox[1][1]],
                    [bbox[0][0], bbox[1][1]],
                    [bbox[0][0], bbox[0][1]]
                ]]
            },
            properties: {}
        }]
    };

    if (map.getLayer('debug-bbox')) map.removeLayer('debug-bbox');
    if (map.getLayer('debug-points-all')) map.removeLayer('debug-points-all');
    if (map.getLayer('debug-points-inside')) map.removeLayer('debug-points-inside');
    if (map.getSource('debug-bbox')) map.removeSource('debug-bbox');
    if (map.getSource('debug-points-all')) map.removeSource('debug-points-all');
    if (map.getSource('debug-points-inside')) map.removeSource('debug-points-inside');

    map.addSource('debug-bbox', { type: 'geojson', data: bboxGeoJSON });
    map.addLayer({
        id: 'debug-bbox',
        type: 'line',
        source: 'debug-bbox',
        paint: {
            'line-color': '#ffff00',
            'line-width': 2,
            'line-dasharray': [2, 2]
        }
    });

    map.addSource('debug-points-all', { type: 'geojson', data: allPointsGeoJSON });
    map.addLayer({
        id: 'debug-points-all',
        type: 'circle',
        source: 'debug-points-all',
        paint: {
            'circle-radius': 4,
            'circle-color': '#ff0000',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff'
        }
    });

    map.addSource('debug-points-inside', { type: 'geojson', data: insidePointsGeoJSON });
    map.addLayer({
        id: 'debug-points-inside',
        type: 'circle',
        source: 'debug-points-inside',
        paint: {
            'circle-radius': 5,
            'circle-color': '#00ff00',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff'
        }
    });

    console.log('[MapDebug] Visualization added - Yellow: bbox, Red: all points, Green: inside points');
};

export const removeDebugVisualization = (map) => {
    if (!map) return;

    const debugLayers = ['debug-bbox', 'debug-points-all', 'debug-points-inside'];
    const debugSources = ['debug-bbox', 'debug-points-all', 'debug-points-inside'];

    debugLayers.forEach(layerId => {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
    });

    debugSources.forEach(sourceId => {
        if (map.getSource(sourceId)) map.removeSource(sourceId);
    });

    console.log('[MapDebug] Visualization removed');
};