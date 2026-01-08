// Location Service for Kumbh Sarthi
import type { Coordinates, Facility, FacilityType } from '../types';
import { KUMBH_CENTER, FACILITY_TYPES } from '../constants';

// Facility data for Nashik Kumbh Mela 2026
// This can be updated with official data when available
const FACILITIES: Facility[] = [
    // Ghats
    { id: 'ramkund', name: 'Ramkund', nameHi: 'रामकुंड', type: 'ghat', location: { lat: 19.9975, lng: 73.7898 }, description: 'Most sacred ghat - Lord Rama bathed here', descriptionHi: 'सबसे पवित्र घाट - भगवान राम ने यहाँ स्नान किया' },
    { id: 'tapovan', name: 'Tapovan', nameHi: 'तपोवन', type: 'ghat', location: { lat: 20.0012, lng: 73.7945 }, description: 'Ancient meditation site', descriptionHi: 'प्राचीन ध्यान स्थल' },
    { id: 'panchavati', name: 'Panchavati Ghat', nameHi: 'पंचवटी घाट', type: 'ghat', location: { lat: 19.9989, lng: 73.7912 }, description: 'Where Lord Rama lived during exile', descriptionHi: 'जहाँ भगवान राम ने वनवास के दौरान निवास किया' },

    // Temples
    { id: 'kalaram', name: 'Kalaram Temple', nameHi: 'काळाराम मंदिर', type: 'temple', location: { lat: 19.9982, lng: 73.7901 }, description: 'Famous temple with black stone idol of Lord Rama', descriptionHi: 'भगवान राम की काले पत्थर की मूर्ति वाला प्रसिद्ध मंदिर' },
    { id: 'sundar-narayan', name: 'Sundar Narayan Temple', nameHi: 'सुंदर नारायण मंदिर', type: 'temple', location: { lat: 19.9970, lng: 73.7888 }, description: 'Ancient Vishnu temple', descriptionHi: 'प्राचीन विष्णु मंदिर' },
    { id: 'trimbakeshwar', name: 'Trimbakeshwar', nameHi: 'त्र्यंबकेश्वर', type: 'temple', location: { lat: 19.9322, lng: 73.5305 }, description: 'One of the 12 Jyotirlingas', descriptionHi: '12 ज्योतिर्लिंगों में से एक' },

    // Medical Facilities
    { id: 'med-1', name: 'Main Medical Camp', nameHi: 'मुख्य चिकित्सा शिविर', type: 'medical', location: { lat: 19.9965, lng: 73.7910 }, description: '24/7 emergency services', descriptionHi: '24/7 आपातकालीन सेवाएं' },
    { id: 'med-2', name: 'First Aid - Ramkund', nameHi: 'प्राथमिक चिकित्सा - रामकुंड', type: 'medical', location: { lat: 19.9978, lng: 73.7895 }, description: 'First aid and minor treatments', descriptionHi: 'प्राथमिक उपचार' },
    { id: 'med-3', name: 'First Aid - Tapovan', nameHi: 'प्राथमिक चिकित्सा - तपोवन', type: 'medical', location: { lat: 20.0018, lng: 73.7938 }, description: 'First aid station', descriptionHi: 'प्राथमिक उपचार केंद्र' },

    // Water Points
    { id: 'water-1', name: 'Water Station 1', nameHi: 'पानी केंद्र 1', type: 'water', location: { lat: 19.9972, lng: 73.7902 }, description: 'Clean drinking water', descriptionHi: 'स्वच्छ पेयजल' },
    { id: 'water-2', name: 'Water Station 2', nameHi: 'पानी केंद्र 2', type: 'water', location: { lat: 19.9985, lng: 73.7920 }, description: 'RO purified water', descriptionHi: 'आरओ शुद्ध पानी' },
    { id: 'water-3', name: 'Water Station 3', nameHi: 'पानी केंद्र 3', type: 'water', location: { lat: 20.0005, lng: 73.7935 }, description: 'Free drinking water', descriptionHi: 'मुफ्त पेयजल' },

    // Toilets
    { id: 'toilet-1', name: 'Public Toilet Block A', nameHi: 'सार्वजनिक शौचालय A', type: 'toilet', location: { lat: 19.9968, lng: 73.7905 }, description: 'Clean public toilets', descriptionHi: 'स्वच्छ सार्वजनिक शौचालय' },
    { id: 'toilet-2', name: 'Public Toilet Block B', nameHi: 'सार्वजनिक शौचालय B', type: 'toilet', location: { lat: 19.9990, lng: 73.7925 }, description: 'Public toilets with accessibility', descriptionHi: 'सुलभ शौचालय' },
    { id: 'toilet-3', name: 'Public Toilet Block C', nameHi: 'सार्वजनिक शौचालय C', type: 'toilet', location: { lat: 20.0010, lng: 73.7940 }, description: 'Public toilets', descriptionHi: 'सार्वजनिक शौचालय' },

    // Food
    { id: 'food-1', name: 'Annakshetra (Free Food)', nameHi: 'अन्नक्षेत्र', type: 'food', location: { lat: 19.9960, lng: 73.7915 }, description: 'Free vegetarian food for devotees', descriptionHi: 'भक्तों के लिए मुफ्त शाकाहारी भोजन' },
    { id: 'food-2', name: 'Food Stalls Area', nameHi: 'भोजन स्टॉल', type: 'food', location: { lat: 19.9980, lng: 73.7930 }, description: 'Various food vendors', descriptionHi: 'विभिन्न खाद्य विक्रेता' },

    // Parking
    { id: 'park-1', name: 'Main Parking Zone 1', nameHi: 'मुख्य पार्किंग 1', type: 'parking', location: { lat: 19.9940, lng: 73.7850 }, description: 'Large vehicle parking', descriptionHi: 'बड़े वाहन पार्किंग' },
    { id: 'park-2', name: 'Parking Zone 2', nameHi: 'पार्किंग 2', type: 'parking', location: { lat: 20.0030, lng: 73.7960 }, description: 'Two-wheeler and car parking', descriptionHi: 'दोपहिया और कार पार्किंग' },

    // Help Desks
    { id: 'help-1', name: 'Main Help Desk', nameHi: 'मुख्य सहायता केंद्र', type: 'helpdesk', location: { lat: 19.9975, lng: 73.7898 }, description: 'Information and assistance', descriptionHi: 'जानकारी और सहायता' },
    { id: 'help-2', name: 'Police Help Post', nameHi: 'पुलिस सहायता', type: 'helpdesk', location: { lat: 19.9970, lng: 73.7890 }, description: 'Police assistance and complaints', descriptionHi: 'पुलिस सहायता और शिकायत' },

    // Lost & Found
    { id: 'lf-1', name: 'Lost & Found Center', nameHi: 'खोया-पाया केंद्र', type: 'lostfound', location: { lat: 19.9973, lng: 73.7896 }, description: 'Lost persons and belongings', descriptionHi: 'खोए व्यक्ति और सामान' },
];

/**
 * Get current user location using Geolocation API
 */
export async function getCurrentLocation(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
            },
            (error) => {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        reject(new Error('Location permission denied. Please enable location access.'));
                        break;
                    case error.POSITION_UNAVAILABLE:
                        reject(new Error('Location information unavailable.'));
                        break;
                    case error.TIMEOUT:
                        reject(new Error('Location request timed out.'));
                        break;
                    default:
                        reject(new Error('An unknown error occurred.'));
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000, // Cache for 1 minute
            }
        );
    });
}

/**
 * Watch user location for continuous updates
 */
export function watchLocation(
    onUpdate: (coords: Coordinates) => void,
    onError: (error: string) => void
): number | null {
    if (!navigator.geolocation) {
        onError('Geolocation is not supported');
        return null;
    }

    return navigator.geolocation.watchPosition(
        (position) => {
            onUpdate({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            });
        },
        (error) => {
            onError(error.message);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000,
        }
    );
}

/**
 * Stop watching location
 */
export function stopWatchingLocation(watchId: number): void {
    navigator.geolocation.clearWatch(watchId);
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in meters
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = toRad(to.lat - from.lat);
    const dLng = toRad(to.lng - from.lng);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Get all facilities
 */
export function getAllFacilities(): Facility[] {
    return FACILITIES;
}

/**
 * Get facilities by type
 */
export function getFacilitiesByType(type: FacilityType): Facility[] {
    return FACILITIES.filter(f => f.type === type);
}

/**
 * Get nearby facilities from user location
 */
export function getNearbyFacilities(
    userLocation: Coordinates,
    type?: FacilityType,
    radiusMeters: number = 5000
): Facility[] {
    let facilities = type ? getFacilitiesByType(type) : FACILITIES;

    return facilities
        .map(f => ({
            ...f,
            distance: calculateDistance(userLocation, f.location),
        }))
        .filter(f => f.distance! <= radiusMeters)
        .sort((a, b) => a.distance! - b.distance!);
}

/**
 * Get nearest facility of a specific type
 */
export function getNearestFacility(
    userLocation: Coordinates,
    type: FacilityType
): Facility | null {
    const nearby = getNearbyFacilities(userLocation, type);
    return nearby.length > 0 ? nearby[0] : null;
}

/**
 * Open external navigation (Google Maps / Apple Maps)
 */
export function openNavigation(destination: Coordinates, name?: string): void {
    const label = encodeURIComponent(name || 'Destination');
    // Try to detect iOS for Apple Maps, otherwise use Google Maps
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS) {
        window.open(`maps://maps.apple.com/?daddr=${destination.lat},${destination.lng}&q=${label}`, '_blank');
    } else {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`, '_blank');
    }
}

/**
 * Get directions text from user location to destination
 */
export function getDirectionsText(from: Coordinates, to: Facility): string {
    const distance = calculateDistance(from, to.location);
    const distanceStr = formatDistance(distance);

    // Simple direction based on bearing
    const bearing = getBearing(from, to.location);
    const direction = bearingToDirection(bearing);

    return `${to.name} (${to.nameHi}) is ${distanceStr} to your ${direction}. ${to.description || ''}`;
}

function getBearing(from: Coordinates, to: Coordinates): number {
    const dLng = toRad(to.lng - from.lng);
    const lat1 = toRad(from.lat);
    const lat2 = toRad(to.lat);

    const x = Math.sin(dLng) * Math.cos(lat2);
    const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

    const bearing = Math.atan2(x, y) * (180 / Math.PI);
    return (bearing + 360) % 360;
}

function bearingToDirection(bearing: number): string {
    const directions = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
}
