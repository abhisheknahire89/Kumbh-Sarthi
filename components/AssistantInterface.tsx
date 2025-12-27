import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob, Type } from '@google/genai';
import { Waveform } from './Waveform';
import { VedaThinkingIcon, SettingsIcon, MicrophoneIcon } from './icons';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import { searchKnowledgeBase } from '../services/ragService';

interface AssistantInterfaceProps {
    onClose: () => void;
    onSessionEnd: (transcript: { role: 'user' | 'assistant'; content: string }[]) => void;
}

type AssistantStatus = 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

const GREETING_URL = 'https://raw.githubusercontent.com/akashmanjunath2505/public/main/veda-greeting.wav';

const VOICES = [
    { name: 'Kore', gender: 'Female', description: 'Calm, soothing, empathetic.' },
    { name: 'Puck', gender: 'Male', description: 'Soft, gentle, relaxed.' },
    { name: 'Charon', gender: 'Male', description: 'Deep, authoritative, confident.' },
    { name: 'Fenrir', gender: 'Male', description: 'Energetic, clear, fast.' },
    { name: 'Zephyr', gender: 'Female', description: 'Bright, friendly, warm.' },
];

export const AssistantInterface: React.FC<AssistantInterfaceProps> = ({ onClose, onSessionEnd }) => {
    const [status, setStatus] = useState<AssistantStatus>('connecting');
    const [transcriptHistory, setTranscriptHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
    const [showSettings, setShowSettings] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState('Kore');
    const [naturalMode, setNaturalMode] = useState(true);

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const inputAnalyserNodeRef = useRef<AnalyserNode | null>(null);
    const outputAnalyserNodeRef = useRef<AnalyserNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const outputGainNodeRef = useRef<GainNode | null>(null);
    const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
    const nextStartTimeRef = useRef(0);
    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');
    const cleanedUpRef = useRef(false);

    const vadTimeoutIdRef = useRef<number | null>(null);
    const userSpeakingRef = useRef(false);
    const isGreetingRef = useRef(true);

    const cleanup = () => {
        if (cleanedUpRef.current) return;
        cleanedUpRef.current = true;
        if (vadTimeoutIdRef.current) window.clearTimeout(vadTimeoutIdRef.current);
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close()).catch(e => console.error(e));
        }
        for (const source of sourcesRef.current) { try { source.stop(); } catch (e) {} }
        sourcesRef.current.clear();
        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        if (inputAudioContextRef.current?.state !== 'closed') inputAudioContextRef.current?.close();
        if (outputAudioContextRef.current?.state !== 'closed') outputAudioContextRef.current?.close();
    };

    const handleClose = () => {
        cleanup();
        onSessionEnd(transcriptHistory);
        onClose();
    };

    const initialize = async (skipGreeting: boolean = false) => {
        cleanedUpRef.current = false;
        isGreetingRef.current = !skipGreeting;
        setStatus(skipGreeting ? 'listening' : 'connecting');

        if (!process.env.API_KEY) {
            setStatus('error');
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // ONE-TIME PRE-LOAD: We fetch the most relevant patient records before starting the session.
            // This ensures Veda already "knows" everything without needing to stop and "think" during the talk.
            const records = await searchKnowledgeBase("comprehensive patient medical history summary results diagnosis");
            const patientBriefing = records.length > 0 
                ? `YOU HAVE BEEN BRIEFED ON THE FOLLOWING PATIENT RECORDS. DO NOT ASK TO SEE THEM, YOU ALREADY HAVE THEM:\n${records.join('\n---\n')}` 
                : "The patient has not uploaded any records yet.";

            const iac = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            inputAudioContextRef.current = iac;
            inputAnalyserNodeRef.current = iac.createAnalyser();

            const oac = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            outputAudioContextRef.current = oac;
            const oGain = oac.createGain();
            const oAnalyser = oac.createAnalyser();
            oGain.connect(oAnalyser);
            oAnalyser.connect(oac.destination);
            outputGainNodeRef.current = oGain;
            outputAnalyserNodeRef.current = oAnalyser;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            if (!skipGreeting) {
                 try {
                    let audioBuffer: AudioBuffer | null = null;
                    if (GREETING_URL && selectedVoice === 'Kore') {
                        const response = await fetch(GREETING_URL);
                        if (response.ok) {
                            const arrayBuffer = await response.arrayBuffer();
                            audioBuffer = await oac.decodeAudioData(arrayBuffer);
                            setStatus('speaking');
                        }
                    }
                    if (audioBuffer && !cleanedUpRef.current) {
                        const source = oac.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputGainNodeRef.current!);
                        source.addEventListener('ended', () => {
                            isGreetingRef.current = false;
                            if (!cleanedUpRef.current) setStatus('listening');
                        });
                        source.start();
                    } else {
                        isGreetingRef.current = false;
                        if (!cleanedUpRef.current) setStatus('listening');
                    }
                } catch (error) {
                    isGreetingRef.current = false;
                    if (!cleanedUpRef.current) setStatus('listening');
                }
            }

            let systemPrompt = `You are Dr. Veda, a gentle and patient-focused health guide.

CRITICAL INSTRUCTIONS:
1. MULTILINGUAL SUPPORT: You MUST respond in the EXACT SAME LANGUAGE as the patient. If they speak Hindi, answer in Hindi. If they speak Spanish, answer in Spanish.
2. PATIENT CONTEXT: You already possess the patient's records. Do not mention that you are "searching" or "looking them up." Just speak from knowledge.
${patientBriefing}

CONVERSATION STYLE:
- Speak directly to the patient's concerns. Use zero medical jargon.
- If they ask "what's wrong?", use the briefing above to explain their status simply and with deep empathy.
- Your goal is to make them feel heard and calm.`;

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const source = iac.createMediaStreamSource(stream);
                        mediaStreamSourceRef.current = source;
                        const scriptProcessor = iac.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            if (isGreetingRef.current || cleanedUpRef.current) return;
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            let sum = 0.0;
                            for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                            const rms = Math.sqrt(sum / inputData.length);
                            if (rms > 0.02) {
                                userSpeakingRef.current = true;
                                if (vadTimeoutIdRef.current) { window.clearTimeout(vadTimeoutIdRef.current); vadTimeoutIdRef.current = null; }
                            } else if (userSpeakingRef.current) {
                                if (!vadTimeoutIdRef.current) {
                                    vadTimeoutIdRef.current = window.setTimeout(() => {
                                        setStatus('thinking');
                                        userSpeakingRef.current = false; 
                                        vadTimeoutIdRef.current = null;
                                    }, 600); 
                                }
                            }
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
                            const pcmBlob: Blob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            }).catch(() => {});
                        };
                        source.connect(inputAnalyserNodeRef.current!);
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(iac.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (cleanedUpRef.current) return;

                        if (message.serverContent?.outputTranscription) {
                            currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                        } else if (message.serverContent?.inputTranscription) {
                            currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                        }

                        if (message.serverContent?.turnComplete) {
                            const fullInput = currentInputTranscriptionRef.current.trim();
                            const fullOutput = currentOutputTranscriptionRef.current.trim();
                            if (fullInput) setTranscriptHistory(prev => [...prev, { role: 'user', content: fullInput }]);
                            if (fullOutput) setTranscriptHistory(prev => [...prev, { role: 'assistant', content: fullOutput }]);
                            currentInputTranscriptionRef.current = '';
                            currentOutputTranscriptionRef.current = '';
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio) {
                            setStatus('speaking');
                            const audioBuffer = await decodeAudioData(decode(base64Audio), oac, 24000, 1);
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, oac.currentTime);
                            const source = oac.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputGainNodeRef.current!);
                            source.addEventListener('ended', () => {
                                sourcesRef.current.delete(source);
                                if(sourcesRef.current.size === 0 && !isGreetingRef.current && !cleanedUpRef.current) setStatus('listening');
                            });
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }

                        if (message.serverContent?.interrupted) {
                            for (const source of sourcesRef.current.values()) { try { source.stop(); } catch(e) {} sourcesRef.current.delete(source); }
                            nextStartTimeRef.current = 0;
                            if (!cleanedUpRef.current) setStatus('listening');
                        }
                    },
                    onerror: (e) => { setStatus('error'); },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } },
                    systemInstruction: systemPrompt
                },
            });
        } catch (err) { setStatus('error'); }
    };
        
    useEffect(() => {
        initialize();
        return () => cleanup();
    }, []);

    const handleApplySettings = () => { cleanup(); setShowSettings(false); setTimeout(() => initialize(true), 200); };

    // During 'thinking', we show the input analyser so the waveform doesn't vanish, 
    // but the actual audio processing is handled by Gemini.
    const activeAnalyser = (status === 'speaking') ? outputAnalyserNodeRef.current : inputAnalyserNodeRef.current;

    return (
        <div className="fixed inset-0 bg-brand-bg/95 backdrop-blur-3xl z-50 flex flex-col items-center justify-center animate-fade-in text-brand-text-primary overflow-hidden">
            <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-brand-accent/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
            </div>

            {showSettings && (
                <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-brand-bg border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">Veda Settings</h2>
                            <button onClick={() => setShowSettings(false)} className="p-2">&times;</button>
                        </div>
                        <div className="space-y-4">
                            <label className="flex items-center justify-between p-4 bg-white/5 rounded-2xl cursor-pointer" onClick={() => setNaturalMode(!naturalMode)}>
                                <span>Natural Human Mode</span>
                                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${naturalMode ? 'bg-brand-primary' : 'bg-gray-700'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${naturalMode ? 'translate-x-6' : ''}`} />
                                </div>
                            </label>
                            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2">
                                {VOICES.map(voice => (
                                    <button key={voice.name} onClick={() => setSelectedVoice(voice.name)} className={`p-4 rounded-xl border text-left text-sm ${selectedVoice === voice.name ? 'border-brand-primary bg-brand-primary/10' : 'border-white/5 bg-white/5'}`}>
                                        <div className="font-bold">{voice.name}</div>
                                        <div className="text-[10px] opacity-60">{voice.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button onClick={handleApplySettings} className="w-full py-4 bg-brand-primary rounded-2xl font-bold">Save & Reconnect</button>
                    </div>
                </div>
            )}

            <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-40">
                <div className="flex items-center gap-4">
                    <img src="https://raw.githubusercontent.com/akashmanjunath2505/public/main/favicon.png" className="w-8 h-8" alt="Veda" />
                    <div className="text-sm font-bold">DR. VEDA LIVE</div>
                </div>
                <button onClick={() => setShowSettings(true)} className="p-3 bg-white/5 rounded-2xl transition-transform active:scale-95"><SettingsIcon className="w-5 h-5" /></button>
            </div>

            <div className="relative flex flex-col items-center justify-center flex-1 w-full max-w-lg px-8">
                <div className="relative w-[340px] h-[340px] flex items-center justify-center">
                    {status === 'connecting' ? (
                       <VedaThinkingIcon className="w-24 h-24 text-brand-primary animate-pulse" />
                    ) : (
                        <Waveform analyserNode={activeAnalyser} width={340} height={340} />
                    )}
                </div>

                <div className="mt-12 text-center space-y-4 animate-slide-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-surface/50 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        <div className={`w-2 h-2 rounded-full ${status === 'listening' ? 'bg-green-400' : status === 'speaking' ? 'bg-brand-primary' : 'bg-amber-400'}`}></div>
                        {status === 'listening' ? "Tell me about your concern" : status === 'speaking' ? "Veda is speaking" : status === 'thinking' ? "Veda is listening" : "Connecting"}
                    </div>
                    <h2 className="text-2xl font-medium tracking-tight h-16 flex items-center justify-center">
                        {status === 'listening' ? "Tell me about your concern." : 
                         status === 'speaking' ? "I've reviewed your records. Let's talk." :
                         status === 'thinking' ? "..." : ""}
                    </h2>
                </div>
            </div>

            <div className="p-12 w-full flex justify-center z-40">
                <button onClick={handleClose} className="px-8 py-4 bg-red-500/10 text-red-400 rounded-3xl border border-red-500/20 font-bold uppercase tracking-widest text-sm hover:bg-red-500/20 transition-all">End Consultation</button>
            </div>
        </div>
    );
};