import React, { useState } from 'react';
import { EMERGENCY_CONTACTS } from '../constants';
import { emergencyService, triggerEmergencyCall, getEmergencyLocationMessage, shareEmergencyViaWhatsApp, copyEmergencyLocation } from '../services/emergencyService';
import type { EmergencyContact, Coordinates } from '../types';
import type { EmergencyCase } from './admin/types';

interface EmergencyPanelProps {
    userLocation: Coordinates | null;
    onClose?: () => void;
    isFullScreen?: boolean;
}

export const EmergencyPanel: React.FC<EmergencyPanelProps> = ({
    userLocation,
    onClose,
    isFullScreen = false
}) => {
    const [showConfirm, setShowConfirm] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [locationText, setLocationText] = useState<string>('');
    const [activeEmergencyId, setActiveEmergencyId] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    // Listen for status updates from Control Room
    React.useEffect(() => {
        const checkStatus = () => {
            if (activeEmergencyId) {
                const emergency = emergencyService.getEmergencyById(activeEmergencyId);
                if (emergency && emergency.status !== 'New') {
                    // Map status to user-friendly message
                    const statusMap: Record<string, string> = {
                        'Investigating': '🔍 Help Center is reviewing your request...',
                        'Dispatching': '🚑 Team Dispatched! Help is on the way.',
                        'Resolved': '✅ Emergency marked as Resolved.'
                    };
                    setStatusMessage(statusMap[emergency.status] || `Status: ${emergency.status}`);
                }
            }
        };

        window.addEventListener('storage', checkStatus);
        // Also poll every 2 seconds just in case text updates don't trigger storage in same tab reliably (though separate tabs do)
        const interval = setInterval(checkStatus, 2000);

        return () => {
            window.removeEventListener('storage', checkStatus);
            clearInterval(interval);
        };
    }, [activeEmergencyId]);

    const handleEmergencyCall = async (type: EmergencyContact['type']) => {
        setShowConfirm(type);
    };

    const confirmCall = (type: EmergencyContact['type']) => {
        triggerEmergencyCall(type);
        // Also explicitly report here to get the ID, although triggerEmergencyCall does it too.
        // We need the ID to track it.

        const typeMap: Record<string, EmergencyCase['type']> = {
            'ambulance': 'Medical',
            'police': 'Police',
            'fire': 'Fire',
            'helpdesk': 'Crowd'
        };

        const incidentType = typeMap[type] || 'Medical';

        const id = emergencyService.reportEmergency(incidentType, 20.0083, 73.7922, "User called " + type);
        setActiveEmergencyId(id);
        setStatusMessage("🚨 Request Sent. Waiting for response...");
        setShowConfirm(null);
    };

    const handleShareLocation = async () => {
        const text = await getEmergencyLocationMessage();
        setLocationText(text);
        await shareEmergencyViaWhatsApp();
    };

    const handleCopyLocation = async () => {
        const success = await copyEmergencyLocation();
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const containerClass = isFullScreen
        ? "fixed inset-0 bg-brand-bg z-50 flex flex-col p-6 animate-fade-in"
        : "bg-brand-surface/80 backdrop-blur-xl rounded-3xl p-6";

    return (
        <div className={containerClass}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🆘</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-brand-text-primary">Emergency Help</h2>
                        <p className="text-sm text-brand-text-secondary">आपातकालीन सहायता</p>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 text-brand-text-secondary hover:text-brand-text-primary"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Status Message Banner */}
            {statusMessage && (
                <div className="mb-6 p-4 rounded-xl bg-blue-500/20 border border-blue-500/40 animate-pulse text-center">
                    <div className="text-xl mb-1">📢</div>
                    <div className="font-bold text-blue-200 text-lg">{statusMessage}</div>
                </div>
            )}

            {/* Main SOS Button */}
            <button
                onClick={() => handleEmergencyCall('ambulance')}
                className="w-full py-6 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold text-xl mb-6 emergency-pulse transition-all active:scale-95"
            >
                🚑 CALL AMBULANCE (108)
                <div className="text-sm font-normal mt-1 opacity-80">एम्बुलेंस बुलाएं</div>
            </button>

            {/* Emergency Contacts Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                {EMERGENCY_CONTACTS.filter(c => c.type !== 'ambulance').map((contact) => (
                    <button
                        key={contact.number}
                        onClick={() => handleEmergencyCall(contact.type)}
                        className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-all active:scale-95"
                    >
                        <div className="text-2xl mb-2">
                            {contact.type === 'police' ? '👮' : contact.type === 'fire' ? '🚒' : '📞'}
                        </div>
                        <div className="text-sm font-bold text-brand-text-primary">{contact.name}</div>
                        <div className="text-xs text-brand-text-secondary">{contact.nameHi}</div>
                        <div className="text-lg font-bold text-brand-primary mt-1">{contact.number}</div>
                    </button>
                ))}
            </div>

            {/* Location Sharing */}
            <div className="bg-white/5 rounded-2xl p-4 mb-4">
                <div className="text-sm font-bold text-brand-text-primary mb-3">
                    📍 Share Your Location / अपना स्थान साझा करें
                </div>
                {userLocation ? (
                    <div className="text-xs text-brand-text-secondary mb-3">
                        Lat: {userLocation.lat.toFixed(6)}, Lng: {userLocation.lng.toFixed(6)}
                    </div>
                ) : (
                    <div className="text-xs text-amber-400 mb-3">
                        ⚠️ Location not available / स्थान उपलब्ध नहीं
                    </div>
                )}
                <div className="flex gap-2">
                    <button
                        onClick={handleShareLocation}
                        className="flex-1 py-2 px-4 bg-green-500/20 text-green-400 rounded-xl text-sm font-medium hover:bg-green-500/30 transition-all"
                    >
                        📱 WhatsApp
                    </button>
                    <button
                        onClick={handleCopyLocation}
                        className="flex-1 py-2 px-4 bg-blue-500/20 text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-500/30 transition-all"
                    >
                        {copied ? '✓ Copied' : '📋 Copy'}
                    </button>
                </div>
            </div>

            {/* Safety Tips */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                <div className="text-sm font-bold text-amber-400 mb-2">⚠️ Stay Safe / सुरक्षित रहें</div>
                <ul className="text-xs text-brand-text-secondary space-y-1">
                    <li>• Keep your belongings secure / अपना सामान सुरक्षित रखें</li>
                    <li>• Stay hydrated / पानी पीते रहें</li>
                    <li>• Note the nearest help desk / निकटतम सहायता केंद्र याद रखें</li>
                </ul>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-brand-bg border border-white/10 rounded-3xl p-6 max-w-sm w-full animate-slide-up">
                        <div className="text-center mb-6">
                            <div className="text-4xl mb-4">
                                {showConfirm === 'ambulance' ? '🚑' :
                                    showConfirm === 'police' ? '👮' :
                                        showConfirm === 'fire' ? '🚒' : '📞'}
                            </div>
                            <h3 className="text-xl font-bold text-brand-text-primary">
                                Call {EMERGENCY_CONTACTS.find(c => c.type === showConfirm)?.name}?
                            </h3>
                            <p className="text-sm text-brand-text-secondary mt-2">
                                {EMERGENCY_CONTACTS.find(c => c.type === showConfirm)?.number}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(null)}
                                className="flex-1 py-3 bg-white/10 text-brand-text-primary rounded-xl font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => confirmCall(showConfirm as EmergencyContact['type'])}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold"
                            >
                                Call Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmergencyPanel;
