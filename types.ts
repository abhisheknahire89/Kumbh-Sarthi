// Kumbh Sarthi Type Definitions

// Location Types
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Facility {
  id: string;
  name: string;
  nameHi: string;
  type: FacilityType;
  location: Coordinates;
  description?: string;
  descriptionHi?: string;
  isOpen?: boolean;
  distance?: number; // Distance in meters from user
}

export type FacilityType =
  | 'toilet'
  | 'water'
  | 'food'
  | 'medical'
  | 'temple'
  | 'ghat'
  | 'parking'
  | 'helpdesk'
  | 'lostfound';

export interface EmergencyContact {
  name: string;
  nameHi: string;
  number: string;
  type: 'ambulance' | 'police' | 'fire' | 'helpdesk';
}

export interface GhatInfo {
  id: string;
  name: string;
  nameHi: string;
  lat: number;
  lng: number;
  description: string;
  descriptionHi?: string;
}

export interface ShahiSnanDate {
  date: string;
  name: string;
  nameHi: string;
  description: string;
}

// Message Types for Chat
export interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string | StructuredResponse;
  created_at?: string;
  user_id?: string;
}

// Reasoning card for detailed explanations (kept for compatibility)
export interface ReasoningSummaryCard {
  whatThisCouldMean: string;
  why: string;
  whatYouCanDoAtHome: string[];
  ayurvedaAndHouseholdRemedies: string[];
  smallHabitsForRecovery: string[];
  redFlags: string[];
  whenToSeeADoctor: string;
  whatToTellTheDoctor: string;
}

export interface StructuredResponse {
  summary: string;
  facilities?: Facility[];
  directions?: string;
  emergencyInfo?: EmergencyContact[];
  mapLocation?: Coordinates;
  reasoningCard?: ReasoningSummaryCard; // For compatibility
}

// User Profile
export interface Profile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  preferred_language?: string;
}

// Knowledge Base (kept for RAG compatibility)
export interface SourceDocument {
  id: string;
  content: string;
  similarity: number;
}

export interface FileMetadata {
  id: string;
  file_name: string;
  uploaded_at: string;
}

// Location State
export interface UserLocation {
  coordinates: Coordinates | null;
  error: string | null;
  loading: boolean;
  lastUpdated: Date | null;
}