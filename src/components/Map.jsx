import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Map.css';
// import { visualizeDebugPoints } from '../utils/mapDebugUtils'; // Uncomment to enable debug visualization

// Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_PUBLIC_KEY

// Sampson County, NC coordinates
const SAMPSON_CENTER = [-78.3364, 34.9940];
const INITIAL_ZOOM = 10;

const Map = ({ showSoil, showParcels, onParcelSelect, selectedParcelId, mapStyle, onSoilDataSelect }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [parcelIndex, setParcelIndex] = useState(null);
    // Use ref to store the latest onParcelSelect callback to avoid stale closures
    const onParcelSelectRef = useRef(onParcelSelect);
    const onSoilDataSelectRef = useRef(onSoilDataSelect);

    // Helper function to calculate bounding box from geometry coordinates
    const getBoundingBox = (geometry) => {
        let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;

        const processCoords = (coords) => {
            if (typeof coords[0] === 'number') {
                // This is a coordinate pair [lng, lat]
                minLng = Math.min(minLng, coords[0]);
                maxLng = Math.max(maxLng, coords[0]);
                minLat = Math.min(minLat, coords[1]);
                maxLat = Math.max(maxLat, coords[1]);
            } else {
                // This is an array of coordinates or rings
                coords.forEach(processCoords);
            }
        };

        processCoords(geometry.coordinates);
        return [[minLng, minLat], [maxLng, maxLat]];
    };

    // Helper function to generate sample points within a polygon
    const generateSamplePoints = (geometry) => {
        const points = [];
        const bbox = getBoundingBox(geometry);
        const [minLng, minLat] = bbox[0];
        const [maxLng, maxLat] = bbox[1];

        // Generate a grid of points within the bounding box
        const gridSize = 5; // 5x5 grid = 25 sample points
        const lngStep = (maxLng - minLng) / (gridSize + 1);
        const latStep = (maxLat - minLat) / (gridSize + 1);

        for (let i = 1; i <= gridSize; i++) {
            for (let j = 1; j <= gridSize; j++) {
                const lng = minLng + (lngStep * i);
                const lat = minLat + (latStep * j);
                points.push([lng, lat]);
            }
        }

        return points;
    };

    // Simple point-in-polygon test using ray casting
    const pointInPolygon = (point, polygon) => {
        const [x, y] = point;
        let inside = false;

        // Handle both Polygon and MultiPolygon
        const rings = polygon.type === 'MultiPolygon'
            ? polygon.coordinates.flat()
            : polygon.coordinates;

        for (const ring of rings) {
            for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
                const [xi, yi] = ring[i];
                const [xj, yj] = ring[j];

                if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                    inside = !inside;
                }
            }
        }

        return inside;
    };

    // Debug visualization moved to src/utils/mapDebugUtils.js
    // To enable: import { visualizeDebugPoints } from '../utils/mapDebugUtils';
    // Then uncomment the visualizeDebugPoints call below in querySoilFeaturesForParcel

    // Helper function to query all soil features within a parcel and deduplicate
    const querySoilFeaturesForParcel = (parcelFeature, clickPoint) => {
        if (!map.current || !onSoilDataSelectRef.current) {
            console.log('[Map] querySoilFeaturesForParcel: map or callback not available');
            return;
        }

        console.log('[Map] querySoilFeaturesForParcel called');

        const geometry = parcelFeature.geometry;

        // Collect unique Farmland values and Land Capability Classes
        const uniqueFarmlandValues = new Set();
        const uniqueLandCapabilityClasses = new Set();

        // Helper to extract soil data from features
        const extractSoilData = (features) => {
            features.forEach(feature => {
                const props = feature.properties;
                const farmland = props.Farmland || props.farmland;
                const landCapClass = props.land_capability_class || props.Land_Capability_Class;

                if (farmland) {
                    uniqueFarmlandValues.add(farmland);
                }
                if (landCapClass) {
                    uniqueLandCapabilityClasses.add(landCapClass);
                }
            });
        };

        // First, always add the soil at the click point
        const clickSoilFeatures = map.current.queryRenderedFeatures(clickPoint, {
            layers: ['soil-layer']
        });
        extractSoilData(clickSoilFeatures);

        // If we have geometry, sample multiple points within the parcel
        if (geometry && geometry.coordinates) {
            // const bbox = getBoundingBox(geometry); // Only needed for debug visualization
            const samplePoints = generateSamplePoints(geometry);
            console.log(`[Map] Generated ${samplePoints.length} sample points`);

            // Filter points to only those inside the parcel polygon
            const pointsInsideParcel = samplePoints.filter(point => pointInPolygon(point, geometry));
            console.log(`[Map] ${pointsInsideParcel.length} points are inside the parcel`);

            // Debug visualization disabled - to enable, uncomment the import and this line:
            // visualizeDebugPoints(map.current, samplePoints, pointsInsideParcel, bbox);

            // Query soil at each point inside the parcel
            pointsInsideParcel.forEach(point => {
                const screenPoint = map.current.project(point);
                const soilFeatures = map.current.queryRenderedFeatures(screenPoint, {
                    layers: ['soil-layer']
                });
                extractSoilData(soilFeatures);
            });
        }

        const farmlandArray = Array.from(uniqueFarmlandValues);
        const landCapClassArray = Array.from(uniqueLandCapabilityClasses).sort();

        console.log(`[Map] Unique Farmland values found: ${farmlandArray.length}`, farmlandArray);
        console.log(`[Map] Unique Land Capability Classes found: ${landCapClassArray.length}`, landCapClassArray);

        // Pass object with both farmland and land capability class arrays
        if (farmlandArray.length > 0 || landCapClassArray.length > 0) {
            onSoilDataSelectRef.current({
                farmland: farmlandArray,
                landCapabilityClasses: landCapClassArray
            });
        }
    };

    // Update ref whenever onParcelSelect changes
    useEffect(() => {
        onParcelSelectRef.current = onParcelSelect;
    }, [onParcelSelect]);

    // Update ref whenever onSoilDataSelect changes
    useEffect(() => {
        onSoilDataSelectRef.current = onSoilDataSelect;
    }, [onSoilDataSelect]);

    // Load parcel index on mount
    useEffect(() => {
        fetch('/parcel-index.json')
            .then(res => res.json())
            .then(data => {
                setParcelIndex(data);
                console.log(`Loaded parcel index with ${Object.keys(data).length} parcels`);
            })
            .catch(err => {
                console.error('Failed to load parcel index:', err);
            });
    }, []);

    useEffect(() => {
        if (map.current) return; // Initialize map only once

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: mapStyle === 'satellite'
                ? 'mapbox://styles/mapbox/satellite-streets-v12'
                : 'mapbox://styles/mapbox/dark-v11',
            center: SAMPSON_CENTER,
            zoom: INITIAL_ZOOM,
            pitch: 0,
            bearing: 0,
        });

        map.current.on('load', () => {
            // Add Soil Layer
            map.current.addSource('sampson-soil', {
                type: 'vector',
                url: 'mapbox://ayusuftatli.sampson_soil'
            });

            map.current.addLayer({
                id: 'soil-layer',
                type: 'fill',
                source: 'sampson-soil',
                'source-layer': 'combined_layer',
                paint: {
                    'fill-color': [
                        'match',
                        ['get', 'Farmland'],
                        // Prime farmland - Best agricultural land (dark green)
                        'All areas are prime farmland', '#1b5e20',
                        'Prime farmland', '#2d7f3e',
                        // Prime farmland with conditions (medium green)
                        'Prime farmland if drained', '#4caf50',
                        'Prime farmland if irrigated', '#4caf50',
                        'Prime farmland if drained and either protected from flooding or not frequently flooded during the growing season', '#4caf50',
                        'Prime farmland if irrigated and drained', '#4caf50',
                        'Prime farmland if protected from flooding or not frequently flooded during the growing season', '#4caf50',
                        'Prime farmland if irrigated and either protected from flooding or not frequently flooded during the growing season', '#4caf50',
                        // Farmland of statewide importance (light green)
                        'Farmland of statewide importance', '#8bc34a',
                        // Farmland of local importance (yellow-green)
                        'Farmland of local importance', '#cddc39',
                        // Unique farmland (yellow)
                        'Farmland of unique importance', '#ffc107',
                        // Not prime farmland (gray/brown)
                        'Not prime farmland', '#9e9e9e',
                        // Default color for undefined/null values
                        '#757575'
                    ],
                    'fill-opacity': 0.6,
                    'fill-outline-color': 'rgba(255,255,255,0.1)'
                },
                layout: {
                    visibility: 'none'
                }
            });

            // Add Parcels Layer
            map.current.addSource('sampson-parcels', {
                type: 'vector',
                url: 'mapbox://ayusuftatli.sampson_parcels'
            });

            map.current.addLayer({
                id: 'parcels-fill',
                type: 'fill',
                source: 'sampson-parcels',
                'source-layer': 'combined_layer',
                paint: {
                    'fill-color': '#fdbb84',
                    'fill-opacity': 0.1
                },
                layout: {
                    visibility: 'none'
                }
            });

            map.current.addLayer({
                id: 'parcels-outline',
                type: 'line',
                source: 'sampson-parcels',
                'source-layer': 'combined_layer',
                paint: {
                    'line-color': '#ff00ff',
                    'line-width': 1,
                    'line-opacity': 0.7
                },
                layout: {
                    visibility: 'none'
                }
            });

            // Add highlight layer for searched parcel
            map.current.addLayer({
                id: 'parcels-highlight',
                type: 'line',
                source: 'sampson-parcels',
                'source-layer': 'combined_layer',
                paint: {
                    'line-color': '#ff1493',
                    'line-width': 3,
                    'line-opacity': 1
                },
                filter: ['==', 'PARNO', ''],
                layout: {
                    visibility: 'visible'
                }
            });

            // Add hover effects for parcels
            map.current.on('mouseenter', 'parcels-fill', () => {
                map.current.getCanvas().style.cursor = 'pointer';
            });

            map.current.on('mouseleave', 'parcels-fill', () => {
                map.current.getCanvas().style.cursor = '';
            });

            // Add click handler for parcels
            map.current.on('click', 'parcels-fill', (e) => {
                console.log('[Map] Parcel clicked, onParcelSelect available:', !!onParcelSelectRef.current);
                if (e.features && e.features.length > 0) {
                    const feature = e.features[0];
                    const parno = feature.properties.PARNO;

                    if (parno && onParcelSelectRef.current) {
                        console.log('[Map] Calling onParcelSelect with parno:', parno);
                        // Highlight the clicked parcel
                        map.current.setFilter('parcels-highlight', ['==', 'PARNO', parno]);

                        // Call the callback with parcel_id (using PARNO as identifier)
                        onParcelSelectRef.current(parno);

                        // Query all soil features within the parcel's bounding box
                        querySoilFeaturesForParcel(feature, e.point);
                    }
                }
            });

            // Add hover effects for soil
            map.current.on('mouseenter', 'soil-layer', () => {
                map.current.getCanvas().style.cursor = 'pointer';
            });

            map.current.on('mouseleave', 'soil-layer', () => {
                map.current.getCanvas().style.cursor = '';
            });
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, []);

    // Update layer visibility when props change
    useEffect(() => {
        if (!map.current) return;

        map.current.on('load', () => {
            if (map.current.getLayer('soil-layer')) {
                map.current.setLayoutProperty(
                    'soil-layer',
                    'visibility',
                    showSoil ? 'visible' : 'none'
                );
            }
        });

        if (map.current.isStyleLoaded()) {
            if (map.current.getLayer('soil-layer')) {
                map.current.setLayoutProperty(
                    'soil-layer',
                    'visibility',
                    showSoil ? 'visible' : 'none'
                );
            }
        }
    }, [showSoil]);

    useEffect(() => {
        if (!map.current) return;

        map.current.on('load', () => {
            if (map.current.getLayer('parcels-fill')) {
                map.current.setLayoutProperty(
                    'parcels-fill',
                    'visibility',
                    showParcels ? 'visible' : 'none'
                );
                map.current.setLayoutProperty(
                    'parcels-outline',
                    'visibility',
                    showParcels ? 'visible' : 'none'
                );
            }
        });

        if (map.current.isStyleLoaded()) {
            if (map.current.getLayer('parcels-fill')) {
                map.current.setLayoutProperty(
                    'parcels-fill',
                    'visibility',
                    showParcels ? 'visible' : 'none'
                );
                map.current.setLayoutProperty(
                    'parcels-outline',
                    'visibility',
                    showParcels ? 'visible' : 'none'
                );
            }
        }
    }, [showParcels]);

    // Update highlight when selectedParcelId changes (from external source like search)
    useEffect(() => {
        if (!map.current || !map.current.isStyleLoaded()) return;

        if (selectedParcelId && parcelIndex) {
            console.log('[Map] selectedParcelId changed via search:', selectedParcelId);

            // Highlight the selected parcel using ref to avoid setState in effect
            map.current.setFilter('parcels-highlight', ['==', 'PARNO', selectedParcelId]);

            // Fly to the parcel if we have coordinates
            const coordinates = parcelIndex[selectedParcelId];
            if (coordinates) {
                console.log('[Map] Flying to parcel coordinates:', coordinates);

                // Ensure parcels layer is visible
                if (map.current.getLayer('parcels-fill')) {
                    map.current.setLayoutProperty('parcels-fill', 'visibility', 'visible');
                    map.current.setLayoutProperty('parcels-outline', 'visibility', 'visible');
                }

                map.current.flyTo({
                    center: coordinates,
                    zoom: 17,
                    duration: 1500
                });

                // Query soil features after the fly animation completes
                const handleMoveEnd = () => {
                    console.log('[Map] DIAGNOSTIC: Map moveend - querying parcel feature for soil data...');

                    const point = map.current.project(coordinates);
                    console.log('[Map] DIAGNOSTIC: Projected point:', point);

                    const features = map.current.queryRenderedFeatures(point, {
                        layers: ['parcels-fill']
                    });

                    console.log('[Map] DIAGNOSTIC: Features found at parcel center:', features.length);

                    if (features.length > 0) {
                        console.log('[Map] DIAGNOSTIC: Feature properties:', features[0].properties);
                        console.log('[Map] DIAGNOSTIC: Feature has geometry:', !!features[0].geometry);
                        console.log('[Map] DIAGNOSTIC: Calling querySoilFeaturesForParcel...');
                        querySoilFeaturesForParcel(features[0], point);
                    } else {
                        console.log('[Map] DIAGNOSTIC: No parcel feature found at center point - soil data cannot be queried');
                    }

                    // Remove the event listener after it fires once
                    map.current.off('moveend', handleMoveEnd);
                };

                // Listen for the moveend event which fires when fly animation completes
                map.current.once('moveend', handleMoveEnd);
            }
        }
    }, [selectedParcelId, parcelIndex]);

    // Handle map style changes
    useEffect(() => {
        if (!map.current || !map.current.isStyleLoaded()) return;

        const newStyleUrl = mapStyle === 'satellite'
            ? 'mapbox://styles/mapbox/satellite-streets-v12'
            : 'mapbox://styles/mapbox/dark-v11';

        const currentStyle = map.current.getStyle();
        if (currentStyle.sprite !== newStyleUrl) {
            // Store current layers state before style change
            const soilVisible = map.current.getLayoutProperty('soil-layer', 'visibility') === 'visible';
            const parcelsVisible = map.current.getLayoutProperty('parcels-fill', 'visibility') === 'visible';
            const currentFilter = map.current.getFilter('parcels-highlight');

            map.current.setStyle(newStyleUrl);

            // Re-add layers after style loads
            map.current.once('style.load', () => {
                // Add Soil Layer
                map.current.addSource('sampson-soil', {
                    type: 'vector',
                    url: 'mapbox://ayusuftatli.sampson_soil'
                });

                map.current.addLayer({
                    id: 'soil-layer',
                    type: 'fill',
                    source: 'sampson-soil',
                    'source-layer': 'combined_layer',
                    paint: {
                        'fill-color': [
                            'match',
                            ['get', 'Farmland'],
                            // Prime farmland - Best agricultural land (dark green)
                            'All areas are prime farmland', '#1b5e20',
                            'Prime farmland', '#2d7f3e',
                            // Prime farmland with conditions (medium green)
                            'Prime farmland if drained', '#4caf50',
                            'Prime farmland if irrigated', '#4caf50',
                            'Prime farmland if drained and either protected from flooding or not frequently flooded during the growing season', '#4caf50',
                            'Prime farmland if irrigated and drained', '#4caf50',
                            'Prime farmland if protected from flooding or not frequently flooded during the growing season', '#4caf50',
                            'Prime farmland if irrigated and either protected from flooding or not frequently flooded during the growing season', '#4caf50',
                            // Farmland of statewide importance (light green)
                            'Farmland of statewide importance', '#8bc34a',
                            // Farmland of local importance (yellow-green)
                            'Farmland of local importance', '#cddc39',
                            // Unique farmland (yellow)
                            'Farmland of unique importance', '#ffc107',
                            // Not prime farmland (gray/brown)
                            'Not prime farmland', '#9e9e9e',
                            // Default color for undefined/null values
                            '#757575'
                        ],
                        'fill-opacity': 0.6,
                        'fill-outline-color': 'rgba(255,255,255,0.1)'
                    },
                    layout: {
                        visibility: soilVisible ? 'visible' : 'none'
                    }
                });

                // Add Parcels Layer
                map.current.addSource('sampson-parcels', {
                    type: 'vector',
                    url: 'mapbox://ayusuftatli.sampson_parcels'
                });

                map.current.addLayer({
                    id: 'parcels-fill',
                    type: 'fill',
                    source: 'sampson-parcels',
                    'source-layer': 'combined_layer',
                    paint: {
                        'fill-color': '#fdbb84',
                        'fill-opacity': 0.1
                    },
                    layout: {
                        visibility: parcelsVisible ? 'visible' : 'none'
                    }
                });

                map.current.addLayer({
                    id: 'parcels-outline',
                    type: 'line',
                    source: 'sampson-parcels',
                    'source-layer': 'combined_layer',
                    paint: {
                        'line-color': '#ff00ff',
                        'line-width': 1.5,
                        'line-opacity': 0.7
                    },
                    layout: {
                        visibility: parcelsVisible ? 'visible' : 'none'
                    }
                });

                map.current.addLayer({
                    id: 'parcels-highlight',
                    type: 'line',
                    source: 'sampson-parcels',
                    'source-layer': 'combined_layer',
                    paint: {
                        'line-color': '#ff1493',
                        'line-width': 3,
                        'line-opacity': 1
                    },
                    filter: currentFilter || ['==', 'PARNO', ''],
                    layout: {
                        visibility: 'visible'
                    }
                });

                // Re-add event listeners
                map.current.on('mouseenter', 'parcels-fill', () => {
                    map.current.getCanvas().style.cursor = 'pointer';
                });

                map.current.on('mouseleave', 'parcels-fill', () => {
                    map.current.getCanvas().style.cursor = '';
                });

                map.current.on('click', 'parcels-fill', (e) => {
                    if (e.features && e.features.length > 0) {
                        const feature = e.features[0];
                        const parno = feature.properties.PARNO;

                        if (parno && onParcelSelectRef.current) {
                            map.current.setFilter('parcels-highlight', ['==', 'PARNO', parno]);
                            onParcelSelectRef.current(parno);

                            // Query all soil features within the parcel's bounding box
                            querySoilFeaturesForParcel(feature, e.point);
                        }
                    }
                });

                map.current.on('mouseenter', 'soil-layer', () => {
                    map.current.getCanvas().style.cursor = 'pointer';
                });

                map.current.on('mouseleave', 'soil-layer', () => {
                    map.current.getCanvas().style.cursor = '';
                });
            });
        }
    }, [mapStyle]);

    return (
        <div className="map-wrapper">
            <div ref={mapContainer} className="map-container" />
        </div>
    );
};

export default Map;
