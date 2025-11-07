// src/types/chat.ts
export type ChatRole = "user" | "assistant";

export interface ChatSource {
  file_id: number;
  file_name: string;
  page?: number | null;
  score: number;
}

export interface ChatMessage {
  id: number;
  role: ChatRole;
  message: string;
  sources: ChatSource[];
  created_at: string; // ISO
}

export interface ChatSession {
  id: number;
  organization_id: number;
  user_id: number;
  title: string;
  created_at: string; // ISO
}
