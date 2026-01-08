// Emergency Service for Kumbh Sarthi
import { EMERGENCY_CONTACTS } from '../constants';
import type { Coordinates, EmergencyContact } from '../types';
import { getCurrentLocation } from './locationService';

/**
 * Get all emergency contacts
 */
export function getEmergencyContacts(): EmergencyContact[] {
    return EMERGENCY_CONTACTS;
}

/**
 * Get emergency contact by type
 */
export function getEmergencyContactByType(type: EmergencyContact['type']): EmergencyContact | undefined {
    return EMERGENCY_CONTACTS.find(c => c.type === type);
}

/**
 * Trigger emergency call using tel: protocol
 * This will open the phone dialer with the number
 */
export function triggerEmergencyCall(type: 'ambulance' | 'police' | 'fire' | 'helpdesk'): void {
    const contact = getEmergencyContactByType(type);
    if (contact) {
        // Use tel: protocol to open phone dialer
        window.location.href = `tel:${contact.number}`;
    }
}

/**
 * Get current location and format for emergency sharing
 */
export async function getEmergencyLocationMessage(): Promise<string> {
    try {
        const location = await getCurrentLocation();
        const mapsUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`;

        return `🆘 EMERGENCY at Kumbh Mela Nashik 2026
    
My Location:
Latitude: ${location.lat.toFixed(6)}
Longitude: ${location.lng.toFixed(6)}

Google Maps: ${mapsUrl}

Please send help immediately!`;
    } catch (error) {
        return `🆘 EMERGENCY at Kumbh Mela Nashik 2026

Location: Unable to determine (GPS error)

Please call back for location details.`;
    }
}

/**
 * Share emergency location via WhatsApp
 */
export async function shareEmergencyViaWhatsApp(contactNumber?: string): Promise<void> {
    const message = await getEmergencyLocationMessage();
    const encodedMessage = encodeURIComponent(message);

    if (contactNumber) {
        window.open(`https://wa.me/${contactNumber}?text=${encodedMessage}`, '_blank');
    } else {
        window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    }
}

/**
 * Share emergency location via SMS
 */
export async function shareEmergencyViaSMS(contactNumber: string): Promise<void> {
    const message = await getEmergencyLocationMessage();
    // SMS URL scheme
    window.location.href = `sms:${contactNumber}?body=${encodeURIComponent(message)}`;
}

/**
 * Copy emergency location to clipboard
 */
export async function copyEmergencyLocation(): Promise<boolean> {
    try {
        const message = await getEmergencyLocationMessage();
        await navigator.clipboard.writeText(message);
        return true;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
    }
}

/**
 * Check if emergency keywords are detected in text
 * Supports multiple languages (Hindi, Marathi, English)
 */
export function detectEmergencyKeywords(text: string): { isEmergency: boolean; type?: 'ambulance' | 'police' | 'fire' } {
    const lowerText = text.toLowerCase();

    // Medical emergency keywords
    const medicalKeywords = [
        'ambulance', 'emergency', 'help', 'medical', 'doctor', 'hospital', 'hurt', 'injured', 'bleeding', 'heart attack', 'stroke', 'unconscious', 'fainted',
        'मदद', 'एम्बुलेंस', 'आपातकालीन', 'डॉक्टर', 'अस्पताल', 'चोट', 'खून', 'बेहोश', 'दिल का दौरा',
        'मदत', 'रुग्णवाहिका', 'आणीबाणी', 'डॉक्टर', 'दवाखाना', 'जखम', 'रक्त'
    ];

    // Police emergency keywords
    const policeKeywords = [
        'police', 'theft', 'stolen', 'robbery', 'attack', 'violence', 'crime', 'lost child', 'missing',
        'पुलिस', 'चोरी', 'लूट', 'हमला', 'अपराध', 'बच्चा खोया', 'गुम',
        'पोलिस', 'चोरी', 'दरोडा', 'हल्ला', 'गुन्हा', 'मूल हरवले'
    ];

    // Fire emergency keywords
    const fireKeywords = [
        'fire', 'burning', 'flames', 'smoke',
        'आग', 'जल रहा', 'धुआं',
        'आग', 'जळत', 'धूर'
    ];

    for (const keyword of fireKeywords) {
        if (lowerText.includes(keyword)) {
            return { isEmergency: true, type: 'fire' };
        }
    }

    for (const keyword of policeKeywords) {
        if (lowerText.includes(keyword)) {
            return { isEmergency: true, type: 'police' };
        }
    }

    for (const keyword of medicalKeywords) {
        if (lowerText.includes(keyword)) {
            return { isEmergency: true, type: 'ambulance' };
        }
    }

    return { isEmergency: false };
}

/**
 * Format emergency contact for display
 */
export function formatEmergencyContact(contact: EmergencyContact, useHindi: boolean = false): string {
    const name = useHindi ? contact.nameHi : contact.name;
    return `${name}: ${contact.number}`;
}

/**
 * Get all emergency numbers as formatted string
 */
export function getEmergencyNumbersText(useHindi: boolean = false): string {
    const header = useHindi ? '🆘 आपातकालीन नंबर:' : '🆘 Emergency Numbers:';
    const contacts = EMERGENCY_CONTACTS.map(c => formatEmergencyContact(c, useHindi)).join('\n');
    return `${header}\n${contacts}`;
}
