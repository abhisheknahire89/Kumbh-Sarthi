import React, { useEffect, useRef, useState } from 'react';
import type { Coordinates, Facility, FacilityType } from '../types';
import { KUMBH_CENTER, FACILITY_TYPES, MAP_CONFIG } from '../constants';
import { getAllFacilities, formatDistance } from '../services/locationService';

declare const L: any;

interface MapViewProps {
    userLocation: Coordinates | null;
    onFacilitySelect?: (facility: Facility) => void;
    selectedType?: FacilityType | null;
    height?: string;
}

export const MapView: React.FC<MapViewProps> = ({
    userLocation,
    onFacilitySelect,
    selectedType,
    height = '100%'
}) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const userMarkerRef = useRef<any>(null);
    const facilityMarkersRef = useRef<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        // Create map centered on Ramkund
        const map = L.map(mapContainerRef.current, {
            center: [KUMBH_CENTER.lat, KUMBH_CENTER.lng],
            zoom: MAP_CONFIG.defaultZoom,
            minZoom: MAP_CONFIG.minZoom,
            maxZoom: MAP_CONFIG.maxZoom,
            zoomControl: true,
        });

        // Add tile layer
        L.tileLayer(MAP_CONFIG.tileUrl, {
            attribution: MAP_CONFIG.attribution,
        }).addTo(map);

        mapRef.current = map;
        setIsLoading(false);

        // Add facilities to map
        addFacilityMarkers(map);

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Update user location marker
    useEffect(() => {
        if (!mapRef.current || !userLocation) return;

        if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
        } else {
            // Create user marker with blue pulsing circle
            const userIcon = L.divIcon({
                className: 'user-location-marker',
                html: `
          <div style="
            width: 20px; 
            height: 20px; 
            background: #3B82F6; 
            border: 3px solid white; 
            border-radius: 50%; 
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
            animation: pulse 2s infinite;
          "></div>
          <style>
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.2); opacity: 0.7; }
            }
          </style>
        `,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
            });

            userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
                icon: userIcon,
                zIndexOffset: 1000,
            }).addTo(mapRef.current);

            userMarkerRef.current.bindPopup('<b>Your Location</b><br>आपका स्थान');
        }

        // Center map on user if first time
        mapRef.current.setView([userLocation.lat, userLocation.lng], MAP_CONFIG.defaultZoom);
    }, [userLocation]);

    // Filter facilities by type
    useEffect(() => {
        if (!mapRef.current) return;

        facilityMarkersRef.current.forEach(marker => {
            if (selectedType) {
                if (marker.facilityType === selectedType) {
                    marker.addTo(mapRef.current);
                } else {
                    marker.remove();
                }
            } else {
                marker.addTo(mapRef.current);
            }
        });
    }, [selectedType]);

    const addFacilityMarkers = (map: any) => {
        const facilities = getAllFacilities();

        facilities.forEach(facility => {
            const typeConfig = FACILITY_TYPES[facility.type];

            // Create custom icon
            const icon = L.divIcon({
                className: 'facility-marker',
                html: `
          <div style="
            width: 32px; 
            height: 32px; 
            background: ${typeConfig.color}; 
            border: 2px solid white; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            font-size: 16px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">${typeConfig.icon}</div>
        `,
                iconSize: [32, 32],
                iconAnchor: [16, 16],
            });

            const marker = L.marker([facility.location.lat, facility.location.lng], { icon });

            // Calculate distance if user location available
            let distanceText = '';
            if (userLocation) {
                const distance = Math.sqrt(
                    Math.pow((facility.location.lat - userLocation.lat) * 111000, 2) +
                    Math.pow((facility.location.lng - userLocation.lng) * 111000, 2)
                );
                distanceText = `<br><small>${formatDistance(distance)}</small>`;
            }

            // Create popup
            const popupContent = `
        <div style="min-width: 150px;">
          <b>${facility.name}</b><br>
          <span style="color: #666;">${facility.nameHi}</span>
          ${distanceText}
          <br><br>
          <small>${facility.description || ''}</small>
          <br><br>
          <button onclick="window.openNavigation(${facility.location.lat}, ${facility.location.lng}, '${facility.name}')" 
            style="
              background: #FF9933; 
              color: white; 
              border: none; 
              padding: 6px 12px; 
              border-radius: 6px; 
              cursor: pointer;
              width: 100%;
            ">
            Navigate 🧭
          </button>
        </div>
      `;

            marker.bindPopup(popupContent);
            (marker as any).facilityType = facility.type;
            (marker as any).facilityData = facility;

            marker.on('click', () => {
                if (onFacilitySelect) {
                    onFacilitySelect(facility);
                }
            });

            marker.addTo(map);
            facilityMarkersRef.current.push(marker);
        });

        // Add global navigation function
        (window as any).openNavigation = (lat: number, lng: number, name: string) => {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const encodedName = encodeURIComponent(name);
            if (isIOS) {
                window.open(`maps://maps.apple.com/?daddr=${lat},${lng}&q=${encodedName}`, '_blank');
            } else {
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
            }
        };
    };

    const handleCenterOnUser = () => {
        if (mapRef.current && userLocation) {
            mapRef.current.setView([userLocation.lat, userLocation.lng], MAP_CONFIG.defaultZoom);
        }
    };

    const handleCenterOnKumbh = () => {
        if (mapRef.current) {
            mapRef.current.setView([KUMBH_CENTER.lat, KUMBH_CENTER.lng], MAP_CONFIG.defaultZoom);
        }
    };

    return (
        <div className="relative w-full" style={{ height }}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-brand-bg z-10">
                    <div className="text-brand-primary">Loading map...</div>
                </div>
            )}
            <div ref={mapContainerRef} className="w-full h-full rounded-xl overflow-hidden" />

            {/* Map Controls */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[1000]">
                {userLocation && (
                    <button
                        onClick={handleCenterOnUser}
                        className="p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all"
                        title="Center on my location"
                    >
                        📍
                    </button>
                )}
                <button
                    onClick={handleCenterOnKumbh}
                    className="p-3 bg-brand-primary text-white rounded-full shadow-lg hover:bg-brand-secondary transition-all"
                    title="Center on Ramkund"
                >
                    🛕
                </button>
            </div>

            {/* Legend */}
            <div className="absolute top-4 left-4 bg-brand-bg/90 backdrop-blur-md rounded-xl p-3 z-[1000] max-h-48 overflow-y-auto">
                <div className="text-xs font-bold mb-2 text-brand-text-primary">Legend / चिह्न</div>
                <div className="space-y-1">
                    {Object.entries(FACILITY_TYPES).slice(0, 5).map(([type, config]) => (
                        <div key={type} className="flex items-center gap-2 text-xs text-brand-text-secondary">
                            <span style={{ color: config.color }}>{config.icon}</span>
                            <span>{config.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MapView;
