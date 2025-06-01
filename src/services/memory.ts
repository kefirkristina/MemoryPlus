import { db } from "../database/connection";
import { UserMemory } from "../database/schema";

export class MemoryService {
  async storeMemory(
    userId: string,
    category: string,
    content: string,
    metadata: any = {}
  ): Promise<void> {
    const query = `
      INSERT INTO user_memories (userId, category, content, metadata)
      VALUES (?, ?, ?, ?)
    `;
    await db.run(query, [userId, category, content, JSON.stringify(metadata)]);
  }

  async recallMemories(
    userId: string,
    searchQuery?: string,
    category?: string
  ): Promise<UserMemory[]> {
    let query = `
      SELECT * FROM user_memories 
      WHERE userId = ?
    `;
    const params: any[] = [userId];

    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }

    if (searchQuery) {
      query += ` AND (content LIKE ? OR category LIKE ?)`;
      params.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }

    query += ` ORDER BY timestamp DESC LIMIT 10`;

    return await db.all(query, params);
  }

  async storeChatHistory(
    userId: string,
    message: string,
    response: string
  ): Promise<void> {
    const query = `
      INSERT INTO chat_history (userId, message, response)
      VALUES (?, ?, ?)
    `;
    await db.run(query, [userId, message, response]);
  }

  async getChatHistory(userId: string, limit: number = 10): Promise<any[]> {
    const query = `
      SELECT message, response FROM chat_history 
      WHERE userId = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `;
    return await db.all(query, [userId, limit]);
  }
}

export const memoryService = new MemoryService();