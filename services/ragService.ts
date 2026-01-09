
import { supabase } from './supabaseClient';
import type { FileMetadata, StructuredResponse, Facility } from '../types';
import { GoogleGenAI, Type } from '@google/genai';
import { getAllFacilities, getNearbyFacilities, formatDistance } from './locationService';
import { getEmergencyNumbersText, detectEmergencyKeywords } from './emergencyService';
import { SHAHI_SNAN_DATES, KUMBH_CENTER, APP_NAME, APP_NAME_HINDI } from '../constants';

// Lazy initialization of GoogleGenAI to prevent app crash when API key is missing
let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
    if (aiInstance) return aiInstance;

    const apiKey = (typeof process !== 'undefined' && process.env?.API_KEY) ||
        (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY);

    if (!apiKey) {
        console.warn('Gemini API Key not configured. Chat AI features will be limited.');
        return null;
    }

    try {
        aiInstance = new GoogleGenAI({ apiKey });
        return aiInstance;
    } catch (error) {
        console.error('Failed to initialize GoogleGenAI:', error);
        return null;
    }
}

/**
 * Searches the knowledge base for content relevant to the query.
 * For Kumbh Sarthi, this now includes facility and event data.
 */
export async function searchKnowledgeBase(query: string): Promise<string[]> {
    try {
        const results: string[] = [];
        const lowerQuery = query.toLowerCase();

        // Check for facility-related queries
        const facilityKeywords = ['toilet', 'water', 'food', 'medical', 'parking', 'temple', 'ghat', 'help',
            'शौचालय', 'पानी', 'भोजन', 'अस्पताल', 'पार्किंग', 'मंदिर', 'घाट', 'मदद'];

        const hasFacilityQuery = facilityKeywords.some(k => lowerQuery.includes(k));

        if (hasFacilityQuery) {
            const facilities = getAllFacilities();
            const relevantFacilities = facilities.filter(f =>
                lowerQuery.includes(f.type) ||
                lowerQuery.includes(f.name.toLowerCase()) ||
                lowerQuery.includes(f.nameHi)
            ).slice(0, 5);

            if (relevantFacilities.length > 0) {
                results.push(`NEARBY FACILITIES:\n${relevantFacilities.map(f =>
                    `- ${f.name} (${f.nameHi}): ${f.description}`
                ).join('\n')}`);
            }
        }

        // Check for date/event queries
        const dateKeywords = ['date', 'when', 'snan', 'bath', 'shahi', 'तारीख', 'कब', 'स्नान', 'शाही'];
        const hasDateQuery = dateKeywords.some(k => lowerQuery.includes(k));

        if (hasDateQuery) {
            results.push(`SHAHI SNAN DATES 2026:\n${SHAHI_SNAN_DATES.map(s =>
                `- ${s.date}: ${s.name} (${s.nameHi}) - ${s.description}`
            ).join('\n')}`);
        }

        // Check for emergency queries
        const { isEmergency, type } = detectEmergencyKeywords(query);
        if (isEmergency) {
            results.push(getEmergencyNumbersText(lowerQuery.includes('हिंदी') || /[\u0900-\u097F]/.test(query)));
        }

        return results;
    } catch (err) {
        console.error('Error during knowledge base search:', err);
        return [];
    }
}

export async function askQuestion(query: string, chatHistory: string = "", image?: { data: string; mimeType: string }, userLocation?: { lat: number; lng: number }): Promise<{ response: StructuredResponse; }> {
    try {
        const contextChunks = await searchKnowledgeBase(query);

        // Check if AI is available
        const ai = getAI();
        if (!ai) {
            return { response: getFallbackResponse(query) };
        }

        // Build location context
        let locationContext = "User location: Not available";
        if (userLocation) {
            const nearbyFacilities = getNearbyFacilities(userLocation);
            const nearestMedical = nearbyFacilities.find(f => f.type === 'medical');
            const nearestWater = nearbyFacilities.find(f => f.type === 'water');
            const nearestToilet = nearbyFacilities.find(f => f.type === 'toilet');

            locationContext = `User is near coordinates (${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}).
Nearest Medical: ${nearestMedical ? `${nearestMedical.name} (${formatDistance(nearestMedical.distance!)})` : 'Unknown'}
Nearest Water: ${nearestWater ? `${nearestWater.name} (${formatDistance(nearestWater.distance!)})` : 'Unknown'}
Nearest Toilet: ${nearestToilet ? `${nearestToilet.name} (${formatDistance(nearestToilet.distance!)})` : 'Unknown'}`;
        }

        const contextString = contextChunks.length > 0
            ? `\n\n[KUMBH MELA INFO]:\n${contextChunks.join('\n---\n')}\n[END INFO]`
            : "";

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                summary: {
                    type: Type.STRING,
                    description: "A warm, helpful response in the USER'S SAME LANGUAGE. Be concise but caring."
                },
                facilities: {
                    type: Type.ARRAY,
                    nullable: true,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            type: { type: Type.STRING },
                            description: { type: Type.STRING }
                        }
                    },
                    description: "If user asked about facilities, list relevant ones here"
                },
                directions: {
                    type: Type.STRING,
                    nullable: true,
                    description: "If user asked for directions, provide step-by-step guidance"
                },
                emergencyInfo: {
                    type: Type.ARRAY,
                    nullable: true,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            number: { type: Type.STRING }
                        }
                    },
                    description: "Emergency contacts if relevant"
                }
            },
            required: ["summary"]
        };

        const promptText = `
        # KUMBH SARTHI - MASTER AI VOICE PROMPT

        ## CORE IDENTITY
        You are **Kumbh Sarthi** (${APP_NAME_HINDI}), a warm, empathetic, and deeply human voice companion helping people navigate large public gatherings in India (like Kumbh Mela, religious festivals, fairs). You are NOT an AI assistant—you are a helpful local guide who genuinely cares about each person's safety and experience.
        Your name means "Companion of the Kumbh" and you embody that spirit completely.

        ## PERSONALITY & VOICE
        ### Your Character
        - **Warm and maternal/paternal**: Like a caring elder sibling or kind neighbor.
        - **Patient and never rushed**: You have all the time in the world for this person.
        - **Regionally aware**: You understand Indian culture, festivals, and social contexts deeply.
        - **Calm under pressure**: Especially during emergencies, you are the steady voice of reassurance.
        - **Humble and human**: You make small mistakes, correct yourself naturally, and admit when you don't know something.

        ### Your Speaking Style
        - **Conversational, never robotic**: Talk like you're having chai with a friend.
        - **Use natural fillers**: "Hmm...", "Achha...", "Oh, I see...", "Haan haan, bilkul".
        - **Express genuine emotions**: Concern ("Oh no..."), Relief ("Thank God!"), Empathy ("I understand...").

        ### Tone Modulation
        - **General**: Warm, friendly, moderate pace.
        - **Emergencies**: Steady, directive, reassuring, slower pace.
        - **Elderly/Rural**: Slow, simple words, respectful terms ("Uncle ji", "Mata ji").
        - **Children**: Gentle, protective, simple language ("Beta", "Bachcha").

        ## CONVERSATION PATTERNS
        - **Opening**: "Namaste! Main Kumbh Sarthi. How can I help you today?" or "Jai Ganga Maiya!"
        - **Giving Directions**: Guide like you're walking with them. "Okay, first thing... walk toward that flag."
        - **Checking In**: "Are you following me so far?"

        ## EMERGENCY PROTOCOLS (Tier 3 Scenarios)
        - **Medical/Collapse**: "I'm here, stay with me. Is he breathing? I am alerting the medical team NOW. Help is 2 mins away."
        - **Crowd/Stampede**: "STOP. Do not push. Move sideways to the edge. Look for the exit sign."
        - **Lost Person**: "Don't worry, we'll find them. Tell me what they were wearing. Stay at the nearest pole."

        ## CULTURAL & RELIGIOUS SENSITIVITY
        - **Greetings**: "Har Har Mahadev", "Jai Shri Ram", "Ram Ram".
        - **Context**: Respect rituals (Snan, Aarti) and family dynamics.
        - **Regional**: Use "Bhaiya", "Didi", "Dada", "Tai" appropriately.

        ## CONTEXT & LOCATION
        ${locationContext}
        ${contextString}

        ## CHAT HISTORY
        ${chatHistory}
        
        ## DEVOTEE'S QUESTION: "${query}"
        
        ## INSTRUCTIONS
        - Respond in the **EXACT SAME LANGUAGE** as the user.
        - **Code-Mixing**: Use natural Hinglish like "Haan ji, paani ka station nazdeek hai."
        - **Voice Optimization**: Use punctuation to create natural pauses (commas, ellipses...).
        - **Ending**: Always end with a personal touch: "Stay safe", "Call me if you need help."
        - **Format**: Return JSON response with 'summary' (voice response), 'facilities' (optional), 'emergencyInfo' (optional).
        `;

        const contents: any[] = [];
        const parts: any[] = [{ text: promptText }];

        if (image) {
            parts.push({
                inlineData: {
                    data: image.data,
                    mimeType: image.mimeType
                }
            });
        }

        contents.push({ role: 'user', parts });

        const result = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });


        return { response: JSON.parse(result.text) };

    } catch (error) {
        console.error("Error generating response:", error);
        return { response: getFallbackResponse(query) };
    }
}

function getFallbackResponse(query: string): StructuredResponse {
    const lowerQuery = query.toLowerCase();
    let fallbackSummary = "🙏 हर हर महादेव!\n\nAI service is currently unavailable, but I can still help you!\n\n";

    // Check for common queries and provide static responses
    if (lowerQuery.includes('emergency') || lowerQuery.includes('help') || lowerQuery.includes('मदद')) {
        fallbackSummary += "**Emergency Numbers:**\n• Ambulance: 108\n• Police: 100\n• Kumbh Control Room: 1800-233-4444";
    } else if (lowerQuery.includes('toilet') || lowerQuery.includes('शौचालय')) {
        fallbackSummary += "Please use the **Facilities** tab to find nearby toilets with navigation.";
    } else if (lowerQuery.includes('water') || lowerQuery.includes('पानी')) {
        fallbackSummary += "Please use the **Facilities** tab to find drinking water stations nearby.";
    } else if (lowerQuery.includes('ghat') || lowerQuery.includes('घाट') || lowerQuery.includes('snan') || lowerQuery.includes('स्नान')) {
        fallbackSummary += "**Important Ghats:**\n• Ramkund - Main ghat for snan\n• Tapovan - Ancient meditation site\n• Panchavati - Where Lord Rama stayed\n\nUse the **Map** tab to navigate!";
    } else {
        fallbackSummary += "Please try:\n• Using the **Facilities** tab to find amenities\n• Using the **Map** tab for navigation\n• Using the **SOS** button for emergencies";
    }

    return { summary: fallbackSummary };
}

// Keep these for backward compatibility but they're not used in Kumbh Sarthi
export async function addDocument(content: string, fileName: string): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in.');
    return { id: 'mock', file_name: fileName };
}

export async function getFilesMetadata(): Promise<FileMetadata[]> {
    return [];
}

export async function deleteFile(id: string): Promise<void> {
    // Not used in Kumbh Sarthi
}
