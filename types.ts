export interface SourceDocument {
  id: string;
  content: string;
  similarity: number;
}

export interface ReasoningSummaryCard {
  whatThisCouldMean: string;
  why: string;
  redFlags: string[];
  whatYouCanDoAtHome: string[];
  ayurvedaAndHouseholdRemedies: string[];
  smallHabitsForRecovery: string[];
  whenToSeeADoctor: string;
  whatToTellTheDoctor: string;
}

export interface StructuredResponse {
  summary: string;
  reasoningCard?: ReasoningSummaryCard;
}

export interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string | StructuredResponse; // Content can now be a structured object
  created_at?: string;
  user_id?: string;
}

export interface Profile {
  id: string;
  full_name?: string;
  avatar_url?: string;
}

export interface FileMetadata {
  id: string;
  file_name: string;
  uploaded_at: string;
}