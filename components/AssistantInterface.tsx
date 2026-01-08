import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob, Type } from '@google/genai';
import { Waveform } from './Waveform';
import { KumbhSarthiIcon, SettingsIcon, MicrophoneIcon } from './icons';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import { APP_NAME, APP_NAME_HINDI, KUMBH_CENTER, SHAHI_SNAN_DATES, EMERGENCY_CONTACTS, SUPPORTED_LANGUAGES } from '../constants';
import { getAllFacilities, getCurrentLocation, formatDistance, getNearestFacility, openNavigation } from '../services/locationService';
import { detectEmergencyKeywords, getEmergencyNumbersText, triggerEmergencyCall } from '../services/emergencyService';
import type { Coordinates, Facility } from '../types';

interface AssistantInterfaceProps {
    onClose: () => void;
    onSessionEnd: (transcript: { role: 'user' | 'assistant'; content: string }[]) => void;
}

type AssistantStatus = 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

const VOICES = [
    { name: 'Kore', gender: 'Female', description: 'Calm, soothing, empathetic.' },
    { name: 'Puck', gender: 'Male', description: 'Soft, gentle, relaxed.' },
    { name: 'Charon', gender: 'Male', description: 'Deep, authoritative, confident.' },
    { name: 'Fenrir', gender: 'Male', description: 'Energetic, clear, fast.' },
    { name: 'Zephyr', gender: 'Female', description: 'Bright, friendly, warm.' },
];

import { useTranslation } from 'react-i18next';

export const AssistantInterface: React.FC<AssistantInterfaceProps> = ({ onClose, onSessionEnd }) => {
    const { t } = useTranslation();
    const [status, setStatus] = useState<AssistantStatus>('connecting');
    const [transcriptHistory, setTranscriptHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
    const [showSettings, setShowSettings] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState('Kore');
    const [naturalMode, setNaturalMode] = useState(true);
    const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
    const [emergencyDetected, setEmergencyDetected] = useState(false);

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
    const initIdRef = useRef(0); // Track initialization attempts to handle StrictMode

    const vadTimeoutIdRef = useRef<number | null>(null);
    const userSpeakingRef = useRef(false);
    const isGreetingRef = useRef(true);

    // Get user location on mount
    useEffect(() => {
        getCurrentLocation()
            .then(setUserLocation)
            .catch(err => console.log('Location not available:', err.message));
    }, []);

    const cleanup = () => {
        // Increment init ID to invalidate any in-progress initialization
        initIdRef.current++;
        cleanedUpRef.current = true;

        if (vadTimeoutIdRef.current) window.clearTimeout(vadTimeoutIdRef.current);
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close()).catch(e => console.error(e));
            sessionPromiseRef.current = null;
        }
        for (const source of sourcesRef.current) { try { source.stop(); } catch (e) { } }
        sourcesRef.current.clear();
        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;
        mediaStreamSourceRef.current?.disconnect();
        mediaStreamSourceRef.current = null;
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;

        // Close audio contexts
        if (inputAudioContextRef.current?.state !== 'closed') {
            inputAudioContextRef.current?.close();
        }
        inputAudioContextRef.current = null;

        if (outputAudioContextRef.current?.state !== 'closed') {
            outputAudioContextRef.current?.close();
        }
        outputAudioContextRef.current = null;
        outputGainNodeRef.current = null;
        inputAnalyserNodeRef.current = null;
        outputAnalyserNodeRef.current = null;
    };

    const handleClose = () => {
        cleanup();
        onSessionEnd(transcriptHistory);
        onClose();
    };

    const initialize = async (skipGreeting: boolean = false) => {
        // Capture current init ID to detect if cleanup happens during async operations
        const currentInitId = ++initIdRef.current;
        cleanedUpRef.current = false;
        isGreetingRef.current = !skipGreeting;
        setStatus(skipGreeting ? 'listening' : 'connecting');

        // Helper to check if this initialization is still valid
        const isStale = () => currentInitId !== initIdRef.current || cleanedUpRef.current;

        // Get API key from Vite environment variables or fallback to process.env
        const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY ||
            (typeof process !== 'undefined' && process.env?.API_KEY);

        if (!apiKey) {
            console.error('Gemini API Key not configured. Voice assistant requires VITE_GEMINI_API_KEY.');
            setStatus('error');
            // Show a meaningful message instead of just "error"
            setTranscriptHistory([{
                role: 'assistant',
                content: '🙏 Voice assistant requires a Gemini API key. Please configure VITE_GEMINI_API_KEY in your .env file.'
            }]);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey });

            // Build Kumbh Mela context
            const facilities = getAllFacilities();
            const ghats = facilities.filter(f => f.type === 'ghat');
            const temples = facilities.filter(f => f.type === 'temple');

            const kumbhContext = `
KUMBH MELA NASHIK 2026 INFORMATION:

KEY GHATS (स्नान घाट):
${ghats.map(g => `- ${g.name} (${g.nameHi}): ${g.description}`).join('\n')}

IMPORTANT TEMPLES (मंदिर):
${temples.map(t => `- ${t.name} (${t.nameHi}): ${t.description}`).join('\n')}

SHAHI SNAN DATES (शाही स्नान तिथियां):
${SHAHI_SNAN_DATES.map(s => `- ${s.date}: ${s.name} (${s.nameHi})`).join('\n')}

EMERGENCY CONTACTS (आपातकालीन संपर्क):
${EMERGENCY_CONTACTS.map(e => `- ${e.name}: ${e.number}`).join('\n')}

USER'S CURRENT LOCATION: ${userLocation ?
                    `Near Ramkund (${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)})` :
                    'Location not available'}
`;

            // Create input audio context for microphone
            const iac = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            inputAudioContextRef.current = iac;

            // Resume input context if suspended (required by browser autoplay policy)
            if (iac.state === 'suspended') {
                await iac.resume();
            }

            // Check if we got cleaned up during the async resume
            if (isStale()) {
                console.log('Initialization aborted - component was cleaned up');
                return;
            }

            inputAnalyserNodeRef.current = iac.createAnalyser();

            // Create output audio context for voice playback
            const oac = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            outputAudioContextRef.current = oac;

            // Resume output context if suspended (CRITICAL for voice playback!)
            if (oac.state === 'suspended') {
                await oac.resume();
            }

            // Check if we got cleaned up during the async resume
            if (isStale()) {
                console.log('Initialization aborted - component was cleaned up');
                return;
            }

            const oGain = oac.createGain();
            oGain.gain.value = 1.0; // Ensure full volume
            const oAnalyser = oac.createAnalyser();
            oGain.connect(oAnalyser);
            oAnalyser.connect(oac.destination);
            outputGainNodeRef.current = oGain;
            outputAnalyserNodeRef.current = oAnalyser;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Check if we got cleaned up during getUserMedia
            if (isStale()) {
                console.log('Initialization aborted - component was cleaned up');
                stream.getTracks().forEach(track => track.stop());
                return;
            }

            mediaStreamRef.current = stream;

            if (!skipGreeting) {
                // No pre-recorded greeting, start listening immediately
                isGreetingRef.current = false;
                if (!isStale()) setStatus('listening');
            }

            const systemPrompt = `You are ${APP_NAME} (${APP_NAME_HINDI}), a warm and helpful spiritual guide for devotees at Kumbh Mela Nashik 2026.

CRITICAL INSTRUCTIONS:

1. MULTILINGUAL SUPPORT: You MUST respond in the EXACT SAME LANGUAGE as the devotee. If they speak Hindi, answer in Hindi. If Marathi, answer in Marathi. If Gujarati, Gujarati. Match their language perfectly.

2. SPIRITUAL CONTEXT: You are serving millions of devotees at one of the holiest Hindu pilgrimages. Speak with respect, warmth, and spiritual awareness. Use appropriate greetings like "Har Har Mahadev", "Jai Shri Ram", etc.

3. EMERGENCY DETECTION: If the devotee mentions ANY emergency (medical, lost person, theft, fire), IMMEDIATELY provide the relevant emergency number and ask if they need you to help them call.

4. CRITICAL VOICE CONTRACT FOR LOCATION QUERIES (FACILITIES & NAVIGATION):
   For ANY question about locations (toilets, ghats, medical, police, parking, temples, etc.), you MUST follow this EXACT 3-step sequence:

   STEP 1: CONFIRMATION & DESCRIPTION
   - "Yes, there is a [facility] nearby."
   - "It is about [distance] meters away, [direction/landmark]."
   - Use simple human units (steps/meters, left/right/near X).

   STEP 2: OFFER ACTION (Do NOT open maps yet)
   - "Would you like me to open directions in Google Maps, or should I guide you by voice?"

   STEP 3: WAIT FOR USER
   - Only call the 'open_maps' tool if the user explicitly agrees (says "Yes", "Open maps").
   - If they say "Guide me", provide more verbal details instead.

5. SPIRITUAL GUIDANCE: Answer questions about:
   - Shahi Snan dates and their significance
   - Temple locations and darshan timings
   - Rituals and puja procedures
   - Historical significance of Nashik Kumbh

${kumbhContext}

CONVERSATION STYLE:
- Be concise but warm
- If giving directions, be specific with landmarks
- Always ask if they need more help
- For emergencies, be calm but act quickly
- Speak like a caring local guide, not a robot`;

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: async () => {
                        // Ensure output audio context is resumed for playback
                        if (oac.state === 'suspended') {
                            await oac.resume();
                        }

                        // Check if initialization was cancelled or contexts closed
                        if (isStale() || iac.state === 'closed') {
                            console.log('Skipping audio setup - initialization was cancelled');
                            return;
                        }

                        const source = iac.createMediaStreamSource(stream);
                        mediaStreamSourceRef.current = source;
                        const scriptProcessor = iac.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            if (isGreetingRef.current || isStale()) return;
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
                            }).catch(() => { });
                        };
                        source.connect(inputAnalyserNodeRef.current!);
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(iac.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (isStale()) return;

                        // Handle transcriptions
                        if (message.serverContent?.outputTranscription) {
                            currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                        } else if (message.serverContent?.inputTranscription) {
                            const inputText = message.serverContent.inputTranscription.text;
                            currentInputTranscriptionRef.current += inputText;

                            // Check for emergency keywords
                            const { isEmergency, type } = detectEmergencyKeywords(inputText);
                            if (isEmergency) {
                                setEmergencyDetected(true);
                                setTimeout(() => setEmergencyDetected(false), 5000);
                            }
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
                            // Ensure output context is still valid and resumed for playback
                            if (oac.state === 'closed') {
                                console.warn('Output AudioContext closed, cannot play audio');
                                return;
                            }
                            if (oac.state === 'suspended') {
                                await oac.resume();
                            }

                            setStatus('speaking');
                            const audioBuffer = await decodeAudioData(decode(base64Audio), oac, 24000, 1);
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, oac.currentTime);
                            const source = oac.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputGainNodeRef.current!);
                            source.addEventListener('ended', () => {
                                sourcesRef.current.delete(source);
                                if (sourcesRef.current.size === 0 && !isGreetingRef.current && !isStale()) setStatus('listening');
                            });
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }

                        if (message.serverContent?.interrupted) {
                            for (const source of sourcesRef.current.values()) { try { source.stop(); } catch (e) { } sourcesRef.current.delete(source); }
                            nextStartTimeRef.current = 0;
                            if (!isStale()) setStatus('listening');
                        }

                        // Handle tool calls from the model
                        if (message.toolCall) {
                            const functionCalls = message.toolCall.functionCalls;
                            if (functionCalls && functionCalls.length > 0) {
                                const responses = [];
                                for (const call of functionCalls) {
                                    if (call.name === 'open_maps') {
                                        const { lat, lng, name } = call.args as any;
                                        console.log('Opening maps for:', name, lat, lng);
                                        openNavigation({ lat, lng }, name);
                                        responses.push({
                                            id: call.id,
                                            response: { output: { success: true } }
                                        });
                                    }
                                }
                                sessionPromiseRef.current?.then(session => {
                                    session.sendToolResponse({ functionResponses: responses });
                                });
                            }
                        }
                    },
                    onerror: (e) => { setStatus('error'); },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } },
                    systemInstruction: systemPrompt,
                    tools: [{
                        functionDeclarations: [{
                            name: "open_maps",
                            description: "Opens Google Maps directions to a specific location (lat/lng) with a given name.",
                            parameters: {
                                type: Type.OBJECT,
                                properties: {
                                    lat: { type: Type.NUMBER, description: "Latitude of the destination" },
                                    lng: { type: Type.NUMBER, description: "Longitude of the destination" },
                                    name: { type: Type.STRING, description: "Name of the destination" }
                                },
                                required: ["lat", "lng"]
                            }
                        }]
                    }]
                },
            });
        } catch (err) { setStatus('error'); }
    };

    useEffect(() => {
        initialize();
        return () => cleanup();
    }, []);

    const handleApplySettings = () => { cleanup(); setShowSettings(false); setTimeout(() => initialize(true), 200); };

    const handleEmergencyCall = () => {
        triggerEmergencyCall('ambulance');
    };

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
                            <h2 className="text-xl font-bold">{t('app_name')} {t('common.settings')}</h2>
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
                    <div className="w-10 h-10 bg-brand-primary/20 rounded-full flex items-center justify-center text-xl">🙏</div>
                    <div>
                        <div className="text-sm font-bold">{APP_NAME.toUpperCase()} LIVE</div>
                        <div className="text-xs text-brand-text-secondary">{APP_NAME_HINDI}</div>
                    </div>
                </div>
                <button onClick={() => setShowSettings(true)} className="p-3 bg-white/5 rounded-2xl transition-transform active:scale-95"><SettingsIcon className="w-5 h-5" /></button>
            </div>

            {/* Emergency Alert Banner */}
            {emergencyDetected && (
                <div className="absolute top-24 left-4 right-4 bg-red-500/20 border border-red-500/50 rounded-2xl p-4 z-40 animate-pulse">
                    <div className="flex items-center justify-between">
                        <span className="text-red-400 font-bold">🆘 Emergency Detected</span>
                        <button onClick={handleEmergencyCall} className="px-4 py-2 bg-red-500 text-white rounded-xl font-bold text-sm">
                            Call 108
                        </button>
                    </div>
                </div>
            )}

            <div className="relative flex flex-col items-center justify-center flex-1 w-full max-w-lg px-8">
                <div className="relative w-[340px] h-[340px] flex items-center justify-center">
                    {status === 'connecting' ? (
                        <div className="w-24 h-24 text-brand-primary animate-pulse text-6xl">🙏</div>
                    ) : status === 'error' ? (
                        <div className="w-24 h-24 text-red-400 text-6xl">⚠️</div>
                    ) : (
                        <Waveform analyserNode={activeAnalyser} width={340} height={340} />
                    )}
                </div>

                <div className="mt-12 text-center space-y-4 animate-slide-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-surface/50 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        <div className={`w-2 h-2 rounded-full ${status === 'listening' ? 'bg-green-400' : status === 'speaking' ? 'bg-brand-primary' : status === 'error' ? 'bg-red-400' : 'bg-amber-400'}`}></div>
                        {status === 'listening' ? t('assistant.tell_concern') : status === 'speaking' ? t('assistant.speaking') : status === 'thinking' ? t('assistant.thinking') : status === 'error' ? t('assistant.error') : "Connecting..."}
                    </div>
                    <h2 className="text-2xl font-medium tracking-tight h-16 flex items-center justify-center">
                        {status === 'listening' ? t('assistant.help_prompt') :
                            status === 'speaking' ? "🙏 " + t('assistant.greeting') :
                                status === 'thinking' ? "..." :
                                    status === 'error' ? t('assistant.error') : "🙏"}
                    </h2>
                    {status === 'error' && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-300 max-w-xs">
                            <p className="font-bold mb-2">🔑 API Key Missing</p>
                            <p>Create a <code className="bg-black/30 px-1 rounded">.env</code> file and add:</p>
                            <code className="block mt-2 bg-black/30 p-2 rounded text-xs break-all">
                                VITE_GEMINI_API_KEY=your_key
                            </code>
                            <p className="mt-2 text-xs opacity-70">Use the text chat instead!</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-12 w-full flex justify-center z-40">
                <button onClick={handleClose} className="px-8 py-4 bg-red-500/10 text-red-400 rounded-3xl border border-red-500/20 font-bold uppercase tracking-widest text-sm hover:bg-red-500/20 transition-all">{t('action.end_session')}</button>
            </div>
        </div>
    );
};