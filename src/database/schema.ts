export interface UserMemory {
  id: number;
  userId: string;
  category: string;
  content: string;
  metadata: string; // JSON string
  timestamp: string;
  schema_version: number;
}

export interface UserSchema {
  id: number;
  userId: string;
  schemaName: string;
  schemaDefinition: string; // JSON string
  version: number;
  created_at: string;
}

export interface ChatHistory {
  id: number;
  userId: string;
  message: string;
  response: string;
  timestamp: string;
}