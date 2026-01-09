export type SLAMetricStatus = 'green' | 'amber' | 'red';

export interface EmergencyCase {
    id: string;
    type: 'Medical' | 'Fire' | 'Police' | 'Crowd' | 'LostPerson';
    zone: string;
    timestamp: string; // ISO string
    status: 'New' | 'Investigating' | 'Dispatched' | 'OnScene' | 'Resolved';
    coordinates: { lat: number; lng: number };
    language: string;
    transcriptSnippet?: string; // Short text of what user said
    timeline: {
        voiceTrigger: string;
        classified: string;
        dispatched?: string;
        acknowledged?: string;
        resolved?: string;
    };
    metrics: {
        detectionTime: number; // seconds
        dispatchTime?: number;
        responseTime?: number;
        resolutionTime?: number;
    }
}

export interface ZoneStats {
    id: string;
    name: string;
    activeEmergencies: number;
    activeSessions: number;
    riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
}

export const MOCK_ZONES = ['Ramkund', 'Panchavati', 'Tapovan', 'Nashik Road', 'Dwarka'];
