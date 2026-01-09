import { EmergencyCase } from '../components/admin/types';
import { EMERGENCY_CONTACTS } from '../constants';
import mqtt from 'mqtt';

const MQTT_BROKER = 'wss://broker.hivemq.com:8000/mqtt';
const TOPIC = 'kumbh-sarthi/emergencies/v1';

let client: mqtt.MqttClient | null = null;
let localCache: EmergencyCase[] = [];

// Initialize MQTT connection
const initialize = () => {
    console.log('Connecting to MQTT Broker...');
    client = mqtt.connect(MQTT_BROKER);

    client.on('connect', () => {
        console.log('✅ Connected to HiveMQ Public Broker');
        client?.subscribe(TOPIC, (err) => {
            if (!err) console.log(`📡 Subscribed to ${TOPIC}`);
        });
    });

    client.on('message', (topic, message) => {
        if (topic === TOPIC) {
            try {
                const payload = JSON.parse(message.toString());
                console.log('MQTT Message:', payload);
                handleUpdate(payload);
            } catch (e) {
                console.error("Failed to parse MQTT message", e);
            }
        }
    });
};

const handleUpdate = (payload: { type: string, data: EmergencyCase }) => {
    if (payload.type === 'INSERT') {
        // Avoid duplicates if we just sent it
        if (!localCache.find(c => c.id === payload.data.id)) {
            localCache.unshift(payload.data);
        }
    } else if (payload.type === 'UPDATE') {
        const index = localCache.findIndex(c => c.id === payload.data.id);
        if (index !== -1) {
            localCache[index] = payload.data;
        }
    }
    // Limit cache
    localCache = localCache.slice(0, 50);
    window.dispatchEvent(new Event('storage'));
};

// Start initialization
initialize();


export const triggerEmergencyCall = (type: string) => {
    const contact = EMERGENCY_CONTACTS?.find((c: any) => c.type === type);
    if (contact) {
        window.location.href = `tel:${contact.number}`;
        // Auto-report to control room when user calls
        emergencyService.reportEmergency(type as any, 20.0, 73.8, `User initiated call to ${contact.name}`);
    }
};

export const getEmergencyLocationMessage = async () => {
    return "I need help! Location: 20.000, 73.000 (Mock)";
};

export const shareEmergencyViaWhatsApp = async () => {
    const text = await getEmergencyLocationMessage();
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
};

export const copyEmergencyLocation = async () => {
    const text = await getEmergencyLocationMessage();
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
};

// Fix for AssistantInterface lints
export const detectEmergencyKeywords = (text: string): { isEmergency: boolean; type?: string } => {
    const t = text.toLowerCase();
    if (t.includes('fire')) return { isEmergency: true, type: 'fire' };
    if (t.includes('police') || t.includes('theft') || t.includes('robber') || t.includes('crime')) return { isEmergency: true, type: 'police' };
    if (t.includes('medical') || t.includes('doctor') || t.includes('ambulance') || t.includes('hurt') || t.includes('pain') || t.includes('heart attack')) return { isEmergency: true, type: 'ambulance' };
    if (t.includes('emergency') || t.includes('help') || t.includes('sos')) return { isEmergency: true, type: 'general' };
    return { isEmergency: false };
};

export const getEmergencyNumbersText = (isHindi: boolean = false) => {
    if (isHindi) {
        return "एम्बुलेंस: 108, पुलिस: 100, फायर: 101, हेल्पलाइन: 1920";
    }
    return "Ambulance: 108, Police: 100, Fire: 101, Helpline: 1920";
};

export const emergencyService = {

    // Report a new emergency (Publish to MQTT)
    reportEmergency: (type: EmergencyCase['type'], lat: number, lng: number, transcript?: string) => {
        const id = `LIVE-${Math.floor(Math.random() * 100000)}`;
        const newCase: EmergencyCase = {
            id,
            type,
            zone: 'Current Location',
            timestamp: new Date().toISOString(),
            status: 'New',
            coordinates: { lat, lng },
            language: 'English',
            transcriptSnippet: transcript || "User triggered SOS Alert",
            timeline: {
                voiceTrigger: new Date().toISOString(),
                classified: new Date().toISOString(),
            },
            metrics: {
                detectionTime: 0.5,
            }
        };

        // Optimistic update
        localCache = [newCase, ...localCache].slice(0, 50);
        window.dispatchEvent(new Event('storage'));

        // Publish to Cloud
        if (client && client.connected) {
            client.publish(TOPIC, JSON.stringify({ type: 'INSERT', data: newCase }));
        }

        return id;
    },

    // Get all emergencies (Read from Cache)
    getEmergencies: (): EmergencyCase[] => {
        return localCache;
    },

    // Clear for testing
    clear: () => {
        localCache = [];
        window.dispatchEvent(new Event('storage'));
    },

    // Update emergency status (Publish to MQTT)
    updateEmergencyStatus: (id: string, newStatus: EmergencyCase['status'], timelineEvent?: string) => {
        const caseIndex = localCache.findIndex(c => c.id === id);

        if (caseIndex !== -1) {
            // Optimistic update
            const updatedCase = { ...localCache[caseIndex] };
            updatedCase.status = newStatus;
            localCache[caseIndex] = updatedCase;
            window.dispatchEvent(new Event('storage'));

            // Publish to Cloud
            if (client && client.connected) {
                client.publish(TOPIC, JSON.stringify({ type: 'UPDATE', data: updatedCase }));
            }

            return true;
        }
        return false;
    },

    // Get specific emergency
    getEmergencyById: (id: string): EmergencyCase | undefined => {
        return localCache.find(c => c.id === id);
    }
};
