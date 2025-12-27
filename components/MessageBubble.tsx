import React, { useState } from 'react';
import type { Message, StructuredResponse, ReasoningSummaryCard } from '../types';
import { UserIcon, BrainCircuitIcon, AlertTriangleIcon, HeartPulseIcon, SparklesIcon, ClipboardListIcon, EyeIcon, EyeOffIcon, CopyIcon, CheckCircleIcon, InfoIcon, HabitIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';

interface MessageBubbleProps {
    message: Message;
}

const ReasoningCardSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; }> = ({ title, icon, children }) => (
    <div className="mt-4">
        <div className="flex items-center space-x-3 text-brand-text-secondary">
            {icon}
            <h3 className="font-semibold text-sm tracking-wide uppercase">{title}</h3>
        </div>
        <div className="mt-2 pl-8 text-brand-text-primary text-sm leading-relaxed">
            {children}
        </div>
    </div>
);

const ReasoningSummaryCardDisplay: React.FC<{ card: ReasoningSummaryCard }> = ({ card }) => {
    const [isDetailedView, setIsDetailedView] = useState(false);
    const [copyStatus, setCopyStatus] = useState<'Copy' | 'Copied!'>('Copy');

    const handleCopy = () => {
        const summaryText = `
Veda Visit Summary
--------------------

What to tell the doctor:
${card.whatToTellTheDoctor}

What this could mean:
${card.whatThisCouldMean}

Why this is being considered:
${card.why}

Red Flags to Watch For:
${card.redFlags.map(f => `- ${f}`).join('\n')}

Safe Self-Care At Home:
${card.whatYouCanDoAtHome.map(f => `- ${f}`).join('\n')}

Ayurveda & Household Remedies:
${card.ayurvedaAndHouseholdRemedies.map(f => `- ${f}`).join('\n')}

Small Habits for Recovery:
${card.smallHabitsForRecovery.map(f => `- ${f}`).join('\n')}

When to see a doctor:
${card.whenToSeeADoctor}
        `.trim().replace(/^\s+/gm, '');

        navigator.clipboard.writeText(summaryText);
        setCopyStatus('Copied!');
        setTimeout(() => setCopyStatus('Copy'), 2000);
    };

    return (
        <div className="mt-4 border-t border-white/10 pt-4">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => setIsDetailedView(!isDetailedView)} className="flex items-center space-x-1.5 text-xs text-brand-text-secondary hover:text-brand-text-primary transition-colors focus:outline-none">
                    {isDetailedView ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    <span>{isDetailedView ? 'Simple View' : 'Detailed View'}</span>
                </button>
                <button onClick={handleCopy} className="flex items-center space-x-1.5 text-xs text-brand-text-secondary hover:text-brand-text-primary transition-colors focus:outline-none disabled:opacity-50">
                    {copyStatus === 'Copied!' ? <CheckCircleIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                    <span>{copyStatus} Summary</span>
                </button>
            </div>
            
            <ReasoningCardSection title="What this could mean" icon={<BrainCircuitIcon className="w-5 h-5 text-brand-accent"/>}>
                <p>{card.whatThisCouldMean}</p>
            </ReasoningCardSection>

            {isDetailedView && (
                <>
                    <ReasoningCardSection title="Why Veda thinks this" icon={<InfoIcon className="w-5 h-5 text-sky-400"/>}>
                        <p className="text-sm"><em>{card.why}</em></p>
                    </ReasoningCardSection>

                    <ReasoningCardSection title="Safe Self-Care" icon={<HeartPulseIcon className="w-5 h-5 text-green-400"/>}>
                         <ul className="list-disc list-inside space-y-1">
                            {card.whatYouCanDoAtHome.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </ReasoningCardSection>
                    
                    {card.ayurvedaAndHouseholdRemedies.length > 0 && (
                         <ReasoningCardSection title="Ayurveda & Household Remedies" icon={<SparklesIcon className="w-5 h-5 text-amber-400"/>}>
                             <ul className="list-disc list-inside space-y-1">
                                {card.ayurvedaAndHouseholdRemedies.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </ReasoningCardSection>
                    )}
                    
                    {card.smallHabitsForRecovery.length > 0 && (
                         <ReasoningCardSection title="Small Habits for Recovery" icon={<HabitIcon className="w-5 h-5 text-lime-400"/>}>
                             <ul className="list-disc list-inside space-y-1">
                                {card.smallHabitsForRecovery.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </ReasoningCardSection>
                    )}
                </>
            )}

             <ReasoningCardSection title="Red Flags to Watch" icon={<AlertTriangleIcon className="w-5 h-5 text-red-400"/>}>
                <ul className="list-disc list-inside space-y-1">
                    {card.redFlags.map((flag, i) => <li key={i}>{flag}</li>)}
                </ul>
            </ReasoningCardSection>

            <ReasoningCardSection title="Next Steps" icon={<ClipboardListIcon className="w-5 h-5 text-blue-400"/>}>
                <p><strong>When to see a doctor:</strong> {card.whenToSeeADoctor}</p>
                <p className="mt-2"><strong>What to tell the doctor:</strong> {card.whatToTellTheDoctor}</p>
            </ReasoningCardSection>
        </div>
    );
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const { profile } = useAuth();
    const isUser = message.role === 'user';
    const content = message.content as StructuredResponse;
    const isRedFlag = typeof message.content === 'object' && message.content !== null && 'summary' in message.content && message.content.summary.startsWith("Based on what you've described");

    return (
        <div className={`flex items-start gap-4 message-bubble ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && (
                 <div className="relative p-2 bg-gradient-to-br from-brand-primary to-brand-accent rounded-full flex-shrink-0 shadow-md">
                    <div className="absolute -inset-1 bg-gradient-to-br from-brand-primary to-brand-accent rounded-full blur opacity-50"></div>
                    <img src="https://raw.githubusercontent.com/akashmanjunath2505/public/main/favicon.png" alt="VEDA Logo" className="relative w-6 h-6" />
                </div>
            )}

            <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`relative p-4 rounded-2xl max-w-2xl w-full shadow-lg border backdrop-blur-xl transition-colors ${isUser ? 'bg-brand-primary/50 text-white rounded-br-none border-white/10' : 'text-brand-text-primary rounded-bl-none'} ${isRedFlag ? 'bg-red-900/50 border-red-500/50' : 'bg-brand-surface border-white/10'}`}>
                    {typeof message.content === 'object' && message.content !== null ? (
                        <div>
                            <p className={`whitespace-pre-wrap leading-relaxed ${isRedFlag ? 'font-semibold text-red-100' : ''}`}>{content.summary}</p>
                            {content.reasoningCard && <ReasoningSummaryCardDisplay card={content.reasoningCard} />}
                        </div>
                    ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content as string}</p>
                    )}
                </div>
            </div>

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