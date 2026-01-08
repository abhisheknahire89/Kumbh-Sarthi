import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { MOCK_ZONES } from './types';

// Simple types for Leaflet to avoid large imports in this mock
declare global {
    interface Window {
        L: any;
    }
}

export const ControlRoomMap: React.FC = () => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);

    useEffect(() => {
        if (!mapContainer.current || mapInstance.current) return;

        // Dynamic import for Leaflet to work with SSR/Vite correctly if needed
        import('leaflet').then((L) => {
            // Center on Ramkund, Nashik
            const map = L.map(mapContainer.current!).setView([19.9975, 73.7898], 14);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '© OpenStreetMap contributors, © CARTO',
                maxZoom: 19
            }).addTo(map);

            // Add Zone Markers (Mock Data)
            const zoneLocations = [
                { name: 'Ramkund', lat: 19.9975, lng: 73.7898, risk: 'High' },
                { name: 'Panchavati', lat: 20.0012, lng: 73.7945, risk: 'Medium' },
                { name: 'Tapovan', lat: 20.0050, lng: 73.8000, risk: 'Low' },
                { name: 'Nashik Road', lat: 19.9600, lng: 73.8300, risk: 'Low' },
            ];

            zoneLocations.forEach(zone => {
                const color = zone.risk === 'High' ? 'red' : zone.risk === 'Medium' ? 'orange' : 'green';

                L.circle([zone.lat, zone.lng], {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.3,
                    radius: 300
                }).addTo(map).bindPopup(`
                    <div style="color: black">
                        <strong>${zone.name}</strong><br/>
                        Risk: ${zone.risk}<br/>
                        Status: Active
                    </div>
                `);

                // Add random "hotspots"
                for (let i = 0; i < 5; i++) {
                    L.circle([zone.lat + (Math.random() * 0.004 - 0.002), zone.lng + (Math.random() * 0.004 - 0.002)], {
                        color: 'red',
                        fillColor: '#f03',
                        fillOpacity: 0.5,
                        radius: 20,
                        stroke: false
                    }).addTo(map);
                }
            });

            mapInstance.current = map;
        });

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    return <div ref={mapContainer} className="h-full w-full z-0" />;
};
