import { supabase } from './supabaseClient';
import type { Message } from '../types';

/**
 * Fetches the chat history for a specific user.
 * @param userId The ID of the user whose messages to fetch.
 * @returns A promise that resolves to an array of messages.
 */
export async function fetchMessages(userId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error.message);
    throw new Error(error.message); // Throw a standard Error object for better handling upstream.
  }

  return data || [];
}

/**
 * Adds a new message to the chat history.
 * @param message The message object to add. It must include user_id, role, and content.
 * @returns A promise that resolves when the message has been added.
 */
export async function addMessage(message: Omit<Message, 'id' | 'created_at' | 'sources'>) {
    // We only store the core message data, not the transient sources.
    // If content is an object (structured response), stringify it for the database.
    const contentToStore = typeof message.content === 'object' 
        ? JSON.stringify(message.content) 
        : message.content;

    const { error } = await supabase.from('messages').insert([
        { 
            user_id: message.user_id,
            role: message.role,
            content: contentToStore
        }
    ]);

    if (error) {
        console.error('Error adding message:', error.message);
        throw new Error(error.message); // Throw a standard Error object for better handling upstream.
    }
}