
import { supabase } from './supabaseClient';
import type { FileMetadata, StructuredResponse } from '../types';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * Describes an image using Gemini to make it searchable in the KB.
 */
async function describeImage(base64Data: string, mimeType: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite-latest',
            contents: [
                {
                    parts: [
                        { text: "Analyze this medical document or image. Extract all clinical text, findings, and symptoms. Provide a detailed summary suitable for a searchable medical knowledge base. If it's a lab report, list the markers and values." },
                        { inlineData: { data: base64Data, mimeType: mimeType } }
                    ]
                }
            ]
        });
        return response.text || "Image analyzed with no text results.";
    } catch (err) {
        console.error("Image analysis failed:", err);
        return "Failed to extract medical information from image.";
    }
}

/**
 * Searches the knowledge base for content relevant to the query.
 */
export async function searchKnowledgeBase(query: string): Promise<string[]> {
  try {
    let { data, error } = await supabase.rpc('match_documents_text', {
      query_text: query,
      match_count: 5
    });

    const results = (data as any[])?.map(item => item.content) || [];
    
    if (results.length === 0) {
        const { data: files } = await supabase.from('files').select('file_name');
        if (files && files.length > 0) {
            return [`The patient has these documents: ${files.map(f => f.file_name).join(', ')}.`];
        }
    }
    return results;
  } catch (err) {
    console.error('Error during knowledge base search:', err);
    return [];
  }
}

export async function addDocument(content: string, fileName: string, isImage: boolean = false, base64?: string, mimeType?: string): Promise<any> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be logged in to upload documents.');

  let finalContent = content;
  if (isImage && base64 && mimeType) {
      finalContent = await describeImage(base64, mimeType);
  }

  const { data: fileData, error: insertError } = await supabase
    .from('files')
    .insert([{ file_name: fileName, user_id: user.id }])
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to save document metadata: ${insertError.message}`);
  }

  // Create manual chunk for searchability
  await supabase.from('document_chunks').insert([
      { file_id: fileData.id, content: finalContent, user_id: user.id }
  ]);

  return fileData;
}

export async function getFilesMetadata(): Promise<FileMetadata[]> {
    const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function deleteFile(id: string): Promise<void> {
    const { error } = await supabase.from('files').delete().eq('id', id);
    if (error) throw error;
}

export async function askQuestion(query: string, chatHistory: string = "", image?: { data: string; mimeType: string }): Promise<{ response: StructuredResponse; }> {
    try {
        const contextChunks = await searchKnowledgeBase(query);
        const contextString = contextChunks.length > 0 
            ? `\n\n[USER'S HEALTH RECORDS]:\n${contextChunks.join('\n---\n')}\n[END RECORDS]`
            : "\n\n(Note: No specific matching records found for this query.)";

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                summary: {
                    type: Type.STRING,
                    description: "A warm, comforting response in the USER'S SAME LANGUAGE. Explain things simply."
                },
                reasoningCard: {
                    type: Type.OBJECT,
                    nullable: true,
                    properties: {
                        whatThisCouldMean: { type: Type.STRING },
                        why: { type: Type.STRING },
                        redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        whatYouCanDoAtHome: { type: Type.ARRAY, items: { type: Type.STRING } },
                        ayurvedaAndHouseholdRemedies: { type: Type.ARRAY, items: { type: Type.STRING } },
                        smallHabitsForRecovery: { type: Type.ARRAY, items: { type: Type.STRING } },
                        whenToSeeADoctor: { type: Type.STRING },
                        whatToTellTheDoctor: { type: Type.STRING }
                    },
                    required: ["whatThisCouldMean", "why", "redFlags", "whatYouCanDoAtHome", "ayurvedaAndHouseholdRemedies", "smallHabitsForRecovery", "whenToSeeADoctor", "whatToTellTheDoctor"]
                }
            },
            required: ["summary"]
        };
        
        const promptText = `
        You are Veda, a kind health guide for patients.
        
        CRITICAL RULES:
        1. LANGUAGE: Respond in the EXACT SAME LANGUAGE as the user's question.
        2. NO JARGON: Use simple, everyday words. 
        3. RECORDS: Use the provided [USER'S HEALTH RECORDS] immediately if they relate to the user's concern.
        
        CONTEXT FROM RECORDS:
        ${contextString}

        CHAT HISTORY:
        ${chatHistory}
        
        PATIENT'S CONCERN: "${query}"
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
            model: "gemini-3-pro-preview",
            contents: contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        return { response: JSON.parse(result.text) };

    } catch (error) {
        console.error("Error generating response:", error);
        return { response: { summary: "I'm having a little trouble reading the reports right now, but I'm here. How are you feeling?" } };
    }
}
