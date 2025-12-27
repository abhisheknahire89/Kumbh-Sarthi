
import React, { useState, useRef, useEffect } from 'react';
import type { Message } from '../types';
import { askQuestion } from '../services/ragService';
import { fetchMessages, addMessage } from '../services/chatHistoryService';
import { useAuth } from '../contexts/AuthContext';
import { MessageBubble } from './MessageBubble';
import { SendIcon, VedaThinkingIcon, SpinnerIcon, MicrophoneIcon, UploadIcon } from './icons';
import { AssistantInterface } from './AssistantInterface';

export const ChatInterface: React.FC = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [isAssistantActive, setIsAssistantActive] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{ file: File; preview: string; base64: string } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        const loadHistory = async () => {
            if (!user) return;
            try {
                const history = await fetchMessages(user.id);
                if (history.length === 0) {
                     setMessages([
                        {
                            role: 'assistant',
                            content: "Hello. I'm Veda. I'm here to help you understand your health and your reports in a way that makes sense.\n\nThink of me as your personal guide. If you've uploaded any records, I've already taken a look. Tell me about your concern.",
                        }
                    ]);
                } else {
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
                }
            } catch (error: any) {
                console.error("Failed to load chat history:", error.message || error);
                setMessages([
                    {
                        role: 'assistant',
                        content: "I couldn't load your chat history. Let's start a new conversation.",
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
        if ((!input.trim() && !selectedImage) || isLoading || !user) return;

        const userMessage: Message = { role: 'user', content: input, user_id: user.id };
        setMessages(prev => [...prev, userMessage]);
        
        const currentInput = input;
        const currentImage = selectedImage;
        
        setInput('');
        setSelectedImage(null);
        setIsLoading(true);

        setMessages(prev => [...prev, { role: 'assistant', content: 'thinking', user_id: user.id }]);

        try {
            const chatHistoryString = messages.slice(-5).map(m => `${m.role}: ${typeof m.content === 'string' ? m.content : (m.content as any).summary}`).join('\n');
            const { response } = await askQuestion(
                currentInput, 
                chatHistoryString, 
                currentImage ? { data: currentImage.base64, mimeType: currentImage.file.type } : undefined
            );
            
            const assistantMessage: Message = {
                role: 'assistant',
                content: response,
                user_id: user.id
            };
            
            setMessages(prev => [...prev.slice(0, -1), assistantMessage]);
            
            await addMessage(userMessage);
            await addMessage({ ...assistantMessage, content: JSON.stringify(assistantMessage.content) });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            const assistantMessage: Message = { role: 'assistant', content: `Sorry, I ran into an error: ${errorMessage}` };
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
                alert("Please select an image file.");
            }
        }
    };
    
    const handleSessionEnd = async (transcript: { role: 'user' | 'assistant'; content: string }[]) => {
        if (!user || transcript.length === 0) return;
        
        const newMessages: Message[] = transcript.map(item => ({
            role: item.role,
            content: item.content,
            user_id: user.id,
        }));
        
        setMessages(prev => [...prev, ...newMessages]);

        // Save transcript to database
        for (const msg of newMessages) {
            try {
                await addMessage(msg);
            } catch (error) {
                console.error("Failed to save transcript message:", error);
            }
        }
    };


    if (historyLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <SpinnerIcon className="w-8 h-8 text-brand-primary" />
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
                <div className="max-w-4xl mx-auto flex flex-col gap-2">
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
                                <p className="text-[10px] text-brand-text-secondary uppercase">Ready for Analysis</p>
                            </div>
                        </div>
                    )}

                    <div className="relative animate-slide-up [animation-delay:0.3s] flex items-center gap-3">
                        {/* Voice Button (Conversation Starter) */}
                        <button
                            type="button"
                            onClick={() => setIsAssistantActive(true)}
                            className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-xl border border-white/10 text-brand-text-primary hover:bg-brand-surface hover:text-brand-accent hover:border-brand-accent/50 transition-all duration-200 shadow-lg group"
                            aria-label="Start voice conversation"
                            title="Start Voice Conversation"
                        >
                            <MicrophoneIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        </button>

                        {/* Chat Input & Send Button */}
                        <form onSubmit={handleSendMessage} className="flex-grow flex items-center bg-black/30 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl shadow-black/20 pl-4 pr-2 py-2 focus-within:ring-1 focus-within:ring-white/20 transition-all">
                            {/* Attachment Button */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 text-brand-text-secondary hover:text-brand-accent transition-colors"
                                title="Attach Image"
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
                                placeholder={selectedImage ? "Add a question about this image..." : "Tell me about your concern."}
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
