export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  initialPrompt: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface ChatMessage {
  id: string;
  role: Role;
  text: string; // The English text
  translation?: string; // Portuguese translation
  feedback?: string; // Feedback on the USER'S previous message (only present on MODEL messages)
  audioData?: AudioBuffer; // Decoded audio for playback
  isAudioPlaying?: boolean;
}

export interface AIResponseSchema {
  characterResponse: string;
  translation: string;
  feedback: string;
}

export interface WordDefinition {
  word: string;
  portugueseDefinition: string;
  examples: string[];
}