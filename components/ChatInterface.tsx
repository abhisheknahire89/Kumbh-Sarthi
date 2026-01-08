
import React, { useState, useRef, useEffect } from 'react';
import type { Message, Coordinates } from '../types';
import { askQuestion } from '../services/ragService';
import { fetchMessages, addMessage } from '../services/chatHistoryService';
import { useAuth } from '../contexts/AuthContext';
import { MessageBubble } from './MessageBubble';
import { SendIcon, VedaThinkingIcon, SpinnerIcon, MicrophoneIcon, UploadIcon } from './icons';
import { AssistantInterface } from './AssistantInterface';
import { getCurrentLocation } from '../services/locationService';
import { APP_NAME, APP_NAME_HINDI } from '../constants';

// Anonymous user ID for guests
const ANONYMOUS_USER_ID = 'anonymous-pilgrim';

const WELCOME_MESSAGE = `🙏 **जय श्री राम! हर हर महादेव!**

नमस्ते तीर्थयात्री! मैं **${APP_NAME}** (${APP_NAME_HINDI}) हूं - कुंभ मेला नाशिक 2026 में आपका सहायक।

**I can help you with:**
• 🛕 Finding ghats, temples & religious sites
• 🚻 Locating toilets, water & food facilities
• 🆘 Emergency assistance (ambulance, police)
• 📅 Shahi Snan dates & timings
• 🗺️ Navigation to nearby places

**मैं आपकी मदद कर सकता हूं:**
• स्नान घाट और मंदिर खोजने में
• शौचालय, पानी और भोजन की सुविधाएं
• आपातकालीन सहायता
• शाही स्नान की तिथियां

Ask me anything in Hindi, Marathi, English or your language! 
कुछ भी पूछें - हिंदी, मराठी या अंग्रेजी में!`;

export const ChatInterface: React.FC = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [isAssistantActive, setIsAssistantActive] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{ file: File; preview: string; base64: string } | null>(null);
    const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Get current user ID (authenticated or anonymous)
    const currentUserId = user?.id || ANONYMOUS_USER_ID;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    // Get user location
    useEffect(() => {
        getCurrentLocation()
            .then(setUserLocation)
            .catch(err => console.log('Location not available:', err.message));
    }, []);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                // Only fetch history for authenticated users
                if (user) {
                    const history = await fetchMessages(user.id);
                    if (history.length > 0) {
                        const parsedHistory = history.map(msg => {
                            if (msg.role === 'assistant' && typeof msg.content === 'string' && msg.content.startsWith('{')) {
                                try {
                                    return { ...msg, content: JSON.parse(msg.content) };
                                } catch (e) {
                                    return msg;
                                }
                            }
                            return msg;
                        });
                        setMessages(parsedHistory);
                        setHistoryLoading(false);
                        return;
                    }
                }

                // Show welcome message for new users or guests
                setMessages([
                    {
                        role: 'assistant',
                        content: WELCOME_MESSAGE,
                    }
                ]);
            } catch (error: any) {
                console.error("Failed to load chat history:", error.message || error);
                setMessages([
                    {
                        role: 'assistant',
                        content: WELCOME_MESSAGE,
                    }
                ]);
            } finally {
                setHistoryLoading(false);
            }
        };
        loadHistory();
    }, [user]);

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!input.trim() && !selectedImage) || isLoading) return;

        const userMessage: Message = { role: 'user', content: input, user_id: currentUserId };
        setMessages(prev => [...prev, userMessage]);

        const currentInput = input;
        const currentImage = selectedImage;

        setInput('');
        setSelectedImage(null);
        setIsLoading(true);

        setMessages(prev => [...prev, { role: 'assistant', content: 'thinking', user_id: currentUserId }]);

        try {
            const chatHistoryString = messages.slice(-5).map(m => `${m.role}: ${typeof m.content === 'string' ? m.content : (m.content as any).summary}`).join('\n');
            const { response } = await askQuestion(
                currentInput,
                chatHistoryString,
                currentImage ? { data: currentImage.base64, mimeType: currentImage.file.type } : undefined,
                userLocation || undefined
            );

            const assistantMessage: Message = {
                role: 'assistant',
                content: response,
                user_id: currentUserId
            };

            setMessages(prev => [...prev.slice(0, -1), assistantMessage]);

            // Only save to database for authenticated users
            if (user) {
                try {
                    await addMessage(userMessage);
                    await addMessage({ ...assistantMessage, content: JSON.stringify(assistantMessage.content) });
                } catch (e) {
                    console.log('Could not save message to history');
                }
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            const assistantMessage: Message = {
                role: 'assistant',
                content: `🙏 क्षमा करें / Sorry, I ran into an error: ${errorMessage}\n\nPlease try again or use the Emergency button if you need immediate help.`
            };
            setMessages(prev => [...prev.slice(0, -1), assistantMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = () => {
                    setSelectedImage({
                        file,
                        preview: reader.result as string,
                        base64: (reader.result as string).split(',')[1]
                    });
                };
                reader.readAsDataURL(file);
            } else {
                alert("Please select an image file. / कृपया एक छवि फ़ाइल चुनें।");
            }
        }
    };

    const handleSessionEnd = async (transcript: { role: 'user' | 'assistant'; content: string }[]) => {
        if (transcript.length === 0) return;

        const newMessages: Message[] = transcript.map(item => ({
            role: item.role,
            content: item.content,
            user_id: currentUserId,
        }));

        setMessages(prev => [...prev, ...newMessages]);

        // Save transcript to database only for authenticated users
        if (user) {
            for (const msg of newMessages) {
                try {
                    await addMessage(msg);
                } catch (error) {
                    console.error("Failed to save transcript message:", error);
                }
            }
        }
    };

    // Quick action buttons for common queries
    const quickActions = [
        { emoji: '🚻', label: 'Toilet', labelHi: 'शौचालय', query: 'Where is the nearest toilet?' },
        { emoji: '💧', label: 'Water', labelHi: 'पानी', query: 'Where can I get drinking water?' },
        { emoji: '🛕', label: 'Ghat', labelHi: 'घाट', query: 'Which is the nearest ghat for snan?' },
        { emoji: '⚕️', label: 'Medical', labelHi: 'चिकित्सा', query: 'I need medical help' },
    ];

    const handleQuickAction = (query: string) => {
        setInput(query);
    };


    if (historyLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="text-5xl animate-pulse">🙏</div>
                <SpinnerIcon className="w-8 h-8 text-brand-primary" />
                <p className="text-brand-text-secondary">Loading Kumbh Sarthi...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            {isAssistantActive && (
                <AssistantInterface
                    onClose={() => setIsAssistantActive(false)}
                    onSessionEnd={handleSessionEnd}
                />
            )}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {messages.map((msg, index) => {
                    if (msg.content === 'thinking') {
                        return (
                            <div key={index} className="flex items-start gap-3 justify-start message-bubble">
                                <div className="p-2 bg-gradient-to-br from-brand-primary to-brand-accent rounded-full flex-shrink-0 shadow-md">
                                    <VedaThinkingIcon className="w-6 h-6 text-white" />
                                </div>
                                <div className="bg-brand-surface text-brand-text-primary p-4 rounded-2xl rounded-bl-none max-w-xl shadow-sm border border-white/10 backdrop-blur-xl">
                                    <div className="flex items-center space-x-1.5 h-6">
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0ms]"></span>
                                        <span className="w-2 h-3 bg-slate-400 rounded-full animate-pulse [animation-delay:200ms]"></span>
                                        <span className="w-2 h-4 bg-slate-400 rounded-full animate-pulse [animation-delay:400ms]"></span>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                    return <MessageBubble key={index} message={msg} />;
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-transparent mt-auto">
                <div className="max-w-4xl mx-auto flex flex-col gap-3">
                    {/* Quick Actions - Show only when no messages or few messages */}
                    {messages.length <= 2 && (
                        <div className="flex flex-wrap gap-2 justify-center animate-fade-in">
                            {quickActions.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleQuickAction(action.query)}
                                    className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <span>{action.emoji}</span>
                                    <span className="text-brand-text-primary">{action.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Image Preview Area */}
                    {selectedImage && (
                        <div className="flex items-center gap-3 animate-slide-up bg-black/40 backdrop-blur-xl p-2 rounded-2xl border border-white/10 w-fit ml-15">
                            <div className="relative group">
                                <img src={selectedImage.preview} className="w-16 h-16 rounded-xl object-cover border border-white/10" alt="Upload preview" />
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-lg"
                                >
                                    &times;
                                </button>
                            </div>
                            <div className="pr-2">
                                <p className="text-xs font-bold text-brand-text-primary truncate max-w-[150px]">{selectedImage.file.name}</p>
                                <p className="text-[10px] text-brand-text-secondary uppercase">Ready to send</p>
                            </div>
                        </div>
                    )}

                    <div className="relative animate-slide-up [animation-delay:0.3s] flex items-center gap-3">
                        {/* Voice Button (Conversation Starter) */}
                        <button
                            type="button"
                            onClick={() => setIsAssistantActive(true)}
                            className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-brand-primary/20 to-brand-accent/20 backdrop-blur-xl border border-brand-primary/30 text-brand-primary hover:from-brand-primary/30 hover:to-brand-accent/30 transition-all duration-200 shadow-lg group"
                            aria-label="Start voice conversation"
                            title="बोलकर पूछें / Ask by voice"
                        >
                            <MicrophoneIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        </button>

                        {/* Chat Input & Send Button */}
                        <form onSubmit={handleSendMessage} className="flex-grow flex items-center bg-black/30 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl shadow-black/20 pl-4 pr-2 py-2 focus-within:ring-1 focus-within:ring-brand-primary/30 transition-all">
                            {/* Attachment Button */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 text-brand-text-secondary hover:text-brand-accent transition-colors"
                                title="Attach Image / फोटो जोड़ें"
                            >
                                <UploadIcon className="w-5 h-5" />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                className="hidden"
                                accept="image/*"
                            />

                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={selectedImage ? "इस फोटो के बारे में पूछें..." : "पूछें... Ask anything..."}
                                className="flex-grow py-2 px-2 bg-transparent focus:outline-none text-brand-text-primary placeholder-brand-text-secondary"
                                disabled={isLoading}
                            />

                            <button
                                type="submit"
                                disabled={isLoading || (!input.trim() && !selectedImage)}
                                className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-accent text-white hover:opacity-90 disabled:from-slate-700 disabled:to-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                                aria-label="Send message"
                            >
                                <SendIcon className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
