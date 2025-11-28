import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Map.css';

// Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiYXl1c3VmdGF0bGkiLCJhIjoiY2x2a3JzbHk4MGwzODJpbXd5aGlhZjV2eCJ9.ClFH8_RYI0OWDAIIj91aCw';

// Sampson County, NC coordinates
const SAMPSON_CENTER = [-78.3364, 34.9940];
const INITIAL_ZOOM = 10;

const Map = ({ showSoil, showParcels }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);

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
                        'interpolate',
                        ['linear'],
                        ['get', 'OBJECTID'],
                        0, '#4facfe',
                        500, '#00f2fe',
                        1000, '#667eea',
                        1500, '#764ba2'
                    ],
                    'fill-opacity': 0.6,
                    'fill-outline-color': '#ffffff'
                },
                layout: {
                    visibility: showSoil ? 'visible' : 'none'
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
                    'fill-color': '#f5576c',
                    'fill-opacity': 0.3
                },
                layout: {
                    visibility: showParcels ? 'visible' : 'none'
                }
            });

            map.current.addLayer({
                id: 'parcels-outline',
                type: 'line',
                source: 'sampson-parcels',
                'source-layer': 'combined_layer',
                paint: {
                    'line-color': '#f093fb',
                    'line-width': 1.5,
                    'line-opacity': 0.8
                },
                layout: {
                    visibility: showParcels ? 'visible' : 'none'
                }
            });

            // Add hover effects for parcels
            map.current.on('mouseenter', 'parcels-fill', () => {
                map.current.getCanvas().style.cursor = 'pointer';
            });

            map.current.on('mouseleave', 'parcels-fill', () => {
                map.current.getCanvas().style.cursor = '';
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

    return (
        <div className="map-wrapper">
            <div ref={mapContainer} className="map-container" />
        </div>
    );
};

export default Map;
