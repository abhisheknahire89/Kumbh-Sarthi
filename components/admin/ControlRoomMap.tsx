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

            // Add Zone Markers (Verified GPS Data)
            const zoneLocations = [
                { name: 'Ramkund', lat: 20.0083, lng: 73.7922, risk: 'High', count: 45000 },     // Main Ghat
                { name: 'Panchavati', lat: 20.0139, lng: 73.8103, risk: 'Medium', count: 12500 }, // Temple Area
                { name: 'Tapovan', lat: 20.0015, lng: 73.8148, risk: 'Low', count: 3200 },      // Downstream
                { name: 'Nashik Road', lat: 19.9472, lng: 73.8421, risk: 'Low', count: 8500 },  // Railway Station
                { name: 'Dwarka', lat: 19.9931, lng: 73.8037, risk: 'Medium', count: 15000 }     // Highway Circle
            ];

            zoneLocations.forEach(zone => {
                const color = zone.risk === 'High' ? 'red' : zone.risk === 'Medium' ? 'orange' : 'green';

                L.circle([zone.lat, zone.lng], {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.3,
                    radius: 300
                }).addTo(map).bindPopup(`
                    <div style="color: black; min-width: 150px">
                        <strong style="font-size: 14px">${zone.name}</strong><br/>
                        <div style="margin-top: 4px; display: flex; justify-content: space-between;">
                            <span>Crowd:</span>
                            <strong>${zone.count.toLocaleString()}</strong>
                        </div>
                        <div style="margin-top: 2px; display: flex; justify-content: space-between;">
                            <span>Risk:</span>
                            <span style="color: ${color}; font-weight: bold">${zone.risk}</span>
                        </div>
                        <div style="margin-top: 2px; font-size: 11px; opacity: 0.7">Status: Active</div>
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
