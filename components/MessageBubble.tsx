import React from 'react';
import type { Message, StructuredResponse, Facility, EmergencyContact } from '../types';
import { UserIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';
import { FACILITY_TYPES } from '../constants';
import { openNavigation } from '../services/locationService';

interface MessageBubbleProps {
    message: Message;
}

// Facility Card Component
const FacilityCard: React.FC<{ facility: Facility }> = ({ facility }) => {
    const typeConfig = FACILITY_TYPES[facility.type] || { icon: '📍', name: facility.type, color: '#888' };

    const handleNavigate = () => {
        openNavigation(facility.location, facility.name);
    };

    return (
        <div className="bg-white/10 rounded-xl p-3 border border-white/10 hover:bg-white/15 transition-all">
            <div className="flex items-start gap-3">
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${typeConfig.color}30` }}
                >
                    {typeConfig.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-brand-text-primary text-sm">{facility.name}</div>
                    <div className="text-xs text-brand-text-secondary">{facility.nameHi}</div>
                    {facility.description && (
                        <div className="text-xs text-brand-text-secondary mt-1 line-clamp-2">{facility.description}</div>
                    )}
                </div>
            </div>
            <button
                onClick={handleNavigate}
                className="w-full mt-2 py-2 bg-brand-primary/20 hover:bg-brand-primary/30 text-brand-primary rounded-lg text-xs font-medium transition-all"
            >
                🧭 Navigate / मार्गदर्शन
            </button>
        </div>
    );
};

// Emergency Contact Card Component
const EmergencyContactCard: React.FC<{ contact: EmergencyContact }> = ({ contact }) => {
    const iconMap = {
        ambulance: '🚑',
        police: '👮',
        fire: '🚒',
        helpdesk: '📞'
    };

    const handleCall = () => {
        window.location.href = `tel:${contact.number}`;
    };

    return (
        <button
            onClick={handleCall}
            className="flex items-center gap-3 bg-red-500/20 border border-red-500/30 rounded-xl p-3 hover:bg-red-500/30 transition-all w-full text-left"
        >
            <span className="text-2xl">{iconMap[contact.type] || '📞'}</span>
            <div className="flex-1">
                <div className="font-bold text-red-400 text-sm">{contact.name}</div>
                <div className="text-xs text-red-300">{contact.nameHi}</div>
            </div>
            <div className="text-lg font-bold text-red-400">{contact.number}</div>
        </button>
    );
};

// Simple markdown-like rendering for the summary
const renderText = (text: string) => {
    // Handle bold text with **
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="font-bold text-brand-primary">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const { profile } = useAuth();
    const isUser = message.role === 'user';

    // Parse content - could be string or structured response
    const isStructured = typeof message.content === 'object' && message.content !== null;
    const content = isStructured ? (message.content as StructuredResponse) : null;
    const textContent = isStructured ? content!.summary : (message.content as string);

    // Check if this is an emergency-related message
    const isEmergency = content?.emergencyInfo && content.emergencyInfo.length > 0;

    return (
        <div className={`flex items-start gap-3 message-bubble ${isUser ? 'justify-end' : 'justify-start'}`}>
            {/* Assistant Avatar */}
            {!isUser && (
                <div className="relative p-2 bg-gradient-to-br from-brand-primary to-brand-accent rounded-full flex-shrink-0 shadow-md">
                    <div className="absolute -inset-1 bg-gradient-to-br from-brand-primary to-brand-accent rounded-full blur opacity-40"></div>
                    <span className="relative text-xl">🙏</span>
                </div>
            )}

            {/* Message Content */}
            <div className={`flex flex-col gap-2 max-w-2xl ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`relative p-4 rounded-2xl shadow-lg border backdrop-blur-xl transition-colors ${isUser
                        ? 'bg-brand-primary/30 text-white rounded-br-none border-brand-primary/30'
                        : isEmergency
                            ? 'bg-red-900/30 border-red-500/30 rounded-bl-none'
                            : 'bg-brand-surface border-white/10 rounded-bl-none'
                    }`}
                >
                    {/* Main Summary Text */}
                    <div className="whitespace-pre-wrap leading-relaxed text-brand-text-primary">
                        {textContent.split('\n').map((line, idx) => (
                            <p key={idx} className={idx > 0 ? 'mt-2' : ''}>
                                {renderText(line)}
                            </p>
                        ))}
                    </div>

                    {/* Facilities Grid */}
                    {content?.facilities && content.facilities.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="text-xs font-bold text-brand-text-secondary mb-2 uppercase tracking-wide">
                                📍 Nearby Facilities / नज़दीकी सुविधाएं
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {content.facilities.slice(0, 4).map((facility, idx) => (
                                    <FacilityCard key={idx} facility={facility} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Emergency Contacts */}
                    {content?.emergencyInfo && content.emergencyInfo.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-red-500/30">
                            <div className="text-xs font-bold text-red-400 mb-2 uppercase tracking-wide">
                                🆘 Emergency Contacts / आपातकालीन संपर्क
                            </div>
                            <div className="space-y-2">
                                {content.emergencyInfo.map((contact, idx) => (
                                    <EmergencyContactCard key={idx} contact={contact} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Directions */}
                    {content?.directions && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="text-xs font-bold text-brand-text-secondary mb-2 uppercase tracking-wide">
                                🧭 Directions / दिशा-निर्देश
                            </div>
                            <div className="bg-white/5 rounded-lg p-3 text-sm text-brand-text-primary">
                                {content.directions}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* User Avatar */}
            {isUser && (
                <div className="p-0.5 bg-slate-700 rounded-full flex-shrink-0">
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="User Avatar" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-brand-text-secondary" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};