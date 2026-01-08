import React, { useEffect, useState } from 'react';
import { EmergencyCase, MOCK_ZONES } from './types';
import { emergencyService } from '../../services/emergencyService';

// Mock data generator
const generateMockCase = (): EmergencyCase => {
    const types = ['Medical', 'Fire', 'Police', 'Crowd', 'LostPerson'] as const;
    const type = types[Math.floor(Math.random() * types.length)];
    const zone = MOCK_ZONES[Math.floor(Math.random() * MOCK_ZONES.length)];
    const id = Math.random().toString(36).substr(2, 6).toUpperCase();

    return {
        id: `CASE-${id}`,
        type,
        zone,
        timestamp: new Date().toISOString(),
        status: 'New',
        coordinates: { lat: 19.9975 + (Math.random() * 0.01 - 0.005), lng: 73.7898 + (Math.random() * 0.01 - 0.005) },
        language: ['Hindi', 'Marathi', 'English'][Math.floor(Math.random() * 3)],
        timeline: {
            voiceTrigger: new Date().toISOString(),
            classified: new Date().toISOString(),
        },
        metrics: {
            detectionTime: Math.floor(Math.random() * 5) + 2,
        },
        transcriptSnippet: type === 'Medical' ? "My chest hurts, I need a doctor!" :
            type === 'Fire' ? "There is smoke near the temple!" :
                type === 'LostPerson' ? "I can't find my 6 year old son." :
                    type === 'Crowd' ? "Too many people, someone fainted!" : "Help police needed here!"
    };
};

interface LiveOperationsFeedProps {
    onCaseSelect?: (c: EmergencyCase) => void;
}

export const LiveOperationsFeed: React.FC<LiveOperationsFeedProps> = ({ onCaseSelect }) => {
    const [incidents, setIncidents] = useState<EmergencyCase[]>([]);

    useEffect(() => {
        // Initial Data Load: Combined Mock + Real
        const loadIncidents = () => {
            const real = emergencyService.getEmergencies();
            // For demo, we keep generating mocks, but prioritize real ones at the top
            setIncidents(prev => {
                // Filter out reals from prev to avoid dupes if re-loading
                const mocks = prev.filter(p => !p.id.startsWith('LIVE'));

                // If no mocks yet, generate some
                const effectiveMocks = mocks.length > 0 ? mocks : [generateMockCase(), generateMockCase()];

                return [...real, ...effectiveMocks].slice(0, 50);
            });
        };

        loadIncidents();

        // Listen for updates from other tabs (User App SOS)
        const handleStorageChange = () => loadIncidents();
        window.addEventListener('storage', handleStorageChange);

        // Simulate incoming alerts (Mock)
        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                setIncidents(prev => {
                    const real = emergencyService.getEmergencies();
                    const mocks = prev.filter(p => !p.id.startsWith('LIVE'));
                    return [...real, generateMockCase(), ...mocks].slice(0, 50);
                });
            }
        }, 3000);

        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Medical': return 'text-red-400 bg-red-900/20 border-red-900/50';
            case 'Police': return 'text-blue-400 bg-blue-900/20 border-blue-900/50';
            case 'Fire': return 'text-orange-400 bg-orange-900/20 border-orange-900/50';
            default: return 'text-gray-300 bg-gray-800 border-gray-700';
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {incidents.map((incident) => (
                <div
                    key={incident.id}
                    onClick={() => onCaseSelect && onCaseSelect(incident)}
                    className={`p-4 border rounded-lg hover:bg-white/5 transition-all cursor-pointer ${getTypeColor(incident.type)} animate-fade-in`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/40">{incident.id}</span>
                        <span className="text-xs opacity-70">{new Date(incident.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="font-bold text-lg">{incident.type} Emergency</div>
                            <div className="text-sm opacity-80">📍 {incident.zone}</div>
                        </div>
                        {incident.status === 'New' && (
                            <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                                NEW
                            </span>
                        )}
                    </div>
                    <div className="mt-3 flex gap-4 text-xs font-mono opacity-60 border-t border-white/10 pt-2">
                        <span>🎙️ Lang: {incident.language}</span>
                        <span>⏱️ Detect: {incident.metrics.detectionTime}s</span>
                    </div>
                </div>
            ))}
        </div>
    );
};
