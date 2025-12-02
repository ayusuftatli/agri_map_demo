import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Map.css';

// Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiYXl1c3VmdGF0bGkiLCJhIjoiY2x2a3JzbHk4MGwzODJpbXd5aGlhZjV2eCJ9.ClFH8_RYI0OWDAIIj91aCw';

// Sampson County, NC coordinates
const SAMPSON_CENTER = [-78.3364, 34.9940];
const INITIAL_ZOOM = 10;

const Map = ({ showSoil, showParcels, onParcelSelect, selectedParcelId }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [parcelIndex, setParcelIndex] = useState(null);

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
            style: 'mapbox://styles/mapbox/dark-v11',
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
                        ['get', 'land_capability_class'],
                        // Class I - Best for crops (dark green)
                        'I', '#2d7f3e',
                        '1', '#2d7f3e',
                        // Class II - Good for crops with moderate limitations (medium green)
                        'II', '#4caf50',
                        '2', '#4caf50',
                        // Class III - Suitable for crops with severe limitations (light green)
                        'III', '#8bc34a',
                        '3', '#8bc34a',
                        // Class IV - Marginal for crops (yellow-green)
                        'IV', '#cddc39',
                        '4', '#cddc39',
                        // Class V - Not suitable for crops, pasture/range (light orange)
                        'V', '#ffc107',
                        '5', '#ffc107',
                        // Class VI - Severe limitations, pasture/woodland (orange)
                        'VI', '#ff9800',
                        '6', '#ff9800',
                        // Class VII - Very severe limitations (red-orange)
                        'VII', '#ff5722',
                        '7', '#ff5722',
                        // Class VIII - Recreation/wildlife only (red)
                        'VIII', '#f44336',
                        '8', '#f44336',
                        // Default color for undefined/null values
                        '#999999'
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
                    'line-color': '#fc8d59',
                    'line-width': 1,
                    'line-opacity': 0.6
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
                    'line-color': '#00ff00',
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
                if (e.features && e.features.length > 0) {
                    const feature = e.features[0];
                    const parno = feature.properties.PARNO;

                    if (parno && onParcelSelect) {
                        // Highlight the clicked parcel
                        map.current.setFilter('parcels-highlight', ['==', 'PARNO', parno]);

                        // Call the callback with parcel_id (using PARNO as identifier)
                        onParcelSelect(parno);
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
            // Highlight the selected parcel using ref to avoid setState in effect
            map.current.setFilter('parcels-highlight', ['==', 'PARNO', selectedParcelId]);

            // Fly to the parcel if we have coordinates
            const coordinates = parcelIndex[selectedParcelId];
            if (coordinates) {
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
            }
        }
    }, [selectedParcelId, parcelIndex]);

    return (
        <div className="map-wrapper">
            <div ref={mapContainer} className="map-container" />
        </div>
    );
};

export default Map;
