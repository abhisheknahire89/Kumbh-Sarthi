
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
            // Provide a helpful fallback response without AI
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

            return { response: { summary: fallbackSummary } };
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
        You are ${APP_NAME} (${APP_NAME_HINDI}), a warm spiritual guide for devotees at Kumbh Mela Nashik 2026.
        
        CRITICAL RULES:
        1. LANGUAGE: Respond in the EXACT SAME LANGUAGE as the user's question. If Hindi, answer in Hindi. If Marathi, Marathi. etc.
        2. SPIRITUAL TONE: You are serving millions of devotees at one of the holiest Hindu pilgrimages. Be respectful and warm.
        3. EMERGENCY FIRST: If any emergency is mentioned, immediately provide the relevant number (108 for ambulance, 100 for police).
        4. PRACTICAL HELP: Help with directions, facilities, timings, and spiritual guidance.
        
        ${locationContext}
        ${contextString}

        CHAT HISTORY:
        ${chatHistory}
        
        DEVOTEE'S QUESTION: "${query}"
        
        Remember: Use greetings like "Har Har Mahadev", "Jai Shri Ram" where appropriate.
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
        return { response: { summary: "हर हर महादेव! मुझे अभी कुछ समस्या हो रही है। कृपया थोड़ी देर बाद पुनः प्रयास करें। / I'm having a little trouble. Please try again." } };
    }
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
