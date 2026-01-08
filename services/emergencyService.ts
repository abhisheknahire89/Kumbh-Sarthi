import { EmergencyCase } from '../components/admin/types';

const STORAGE_KEY = 'kumbh_sarthi_emergencies';

export const emergencyService = {
    // Report a new emergency from the user app
    reportEmergency: (type: EmergencyCase['type'], lat: number, lng: number, transcript?: string) => {
        const newCase: EmergencyCase = {
            id: `LIVE-${Math.floor(Math.random() * 10000)}`, // Unique ID for live cases
            type,
            zone: 'Current Location', // simplified for demo
            timestamp: new Date().toISOString(),
            status: 'New',
            coordinates: { lat, lng },
            language: 'English', // Default for now
            transcriptSnippet: transcript || "User triggered SOS Alert",
            timeline: {
                voiceTrigger: new Date().toISOString(),
                classified: new Date().toISOString(),
            },
            metrics: {
                detectionTime: 0.5, // Instant
            }
        };

        const existing = emergencyService.getEmergencies();
        const updated = [newCase, ...existing].slice(0, 50); // Keep last 50
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

        // Trigger event for other tabs
        window.dispatchEvent(new Event('storage'));
    },

    // Get all emergencies
    getEmergencies: (): EmergencyCase[] => {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Failed to parse emergencies", e);
            return [];
        }
    },

    // Clear for testing
    clear: () => {
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new Event('storage'));
    }
};
