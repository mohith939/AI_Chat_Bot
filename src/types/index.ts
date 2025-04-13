export interface User {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
}

export interface Chat {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: 'gemini' | 'ollama';
}

export interface FollowUpQuestion {
  id: string;
  text: string;
}
